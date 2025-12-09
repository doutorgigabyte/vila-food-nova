import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutProRequest {
  order_id: string;
  establishment_id: string;
  amount: number;
  description: string;
  items?: Array<{
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  payer?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CheckoutProRequest = await req.json();
    const { order_id, establishment_id, amount, description, items, payer, back_urls } = requestData;

    // Get origin from request for back_urls
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://vilafood.app';

    console.log('=== CHECKOUT PRO REQUEST ===');
    console.log('Order ID:', order_id);
    console.log('Establishment ID:', establishment_id);
    console.log('Amount:', amount);
    console.log('Origin:', origin);

    // Validação básica
    if (!order_id || !establishment_id || !amount) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Dados obrigatórios: order_id, establishment_id, amount'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar token do estabelecimento
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('mercado_pago_token, mp_public_key, name')
      .eq('id', establishment_id)
      .maybeSingle();

    if (estError || !establishment) {
      console.error('Establishment error:', estError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Estabelecimento não encontrado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Priorizar token da plataforma, depois token do estabelecimento
    const platformToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    const accessToken = platformToken || establishment.mercado_pago_token;
    
    if (!accessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token Mercado Pago não configurado'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construir URLs de retorno usando origin da requisição
    const frontendUrl = origin;
    const defaultBackUrls = {
      success: `${frontendUrl}/checkout/resultado?status=success&order_id=${order_id}`,
      failure: `${frontendUrl}/checkout/resultado?status=failure&order_id=${order_id}`,
      pending: `${frontendUrl}/checkout/resultado?status=pending&order_id=${order_id}`
    };

    // Construir items para a preferência
    const preferenceItems = items && items.length > 0 
      ? items.map(item => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: 'BRL'
        }))
      : [{
          title: description || `Pedido ${establishment.name}`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL'
        }];

    // Construir payload da preferência otimizado para delivery
    const preferencePayload: Record<string, unknown> = {
      items: preferenceItems,
      
      // Excluir métodos de pagamento lentos (boleto, lotérica)
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' },  // Boleto
          { id: 'atm' }      // Lotérica
        ],
        // Sem parcelamento para delivery (pagamento rápido)
        installments: 1
      },
      
      // URLs de retorno
      back_urls: {
        success: back_urls?.success || defaultBackUrls.success,
        failure: back_urls?.failure || defaultBackUrls.failure,
        pending: back_urls?.pending || defaultBackUrls.pending
      },
      
      // Retorno automático após aprovação (3 segundos)
      auto_return: 'approved',
      
      // CRÍTICO: Modo binário - sem status pendente/em análise
      binary_mode: true,
      
      // Nome na fatura do cartão
      statement_descriptor: 'VILA FOOD',
      
      // Referência externa para reconciliação
      external_reference: order_id,
      
      // Webhook de notificação
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`
    };

    // Adicionar dados do pagador se disponível
    if (payer) {
      preferencePayload.payer = {
        ...(payer.email && { email: payer.email }),
        ...(payer.name && { name: payer.name }),
        ...(payer.phone && { 
          phone: { 
            area_code: payer.phone.substring(0, 2),
            number: payer.phone.substring(2)
          }
        })
      };
    }

    console.log('Creating preference with payload:', JSON.stringify(preferencePayload, null, 2));

    // Criar preferência no Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `checkout-pro-${order_id}-${Date.now()}`
      },
      body: JSON.stringify(preferencePayload)
    });

    const mpData = await mpResponse.json();
    console.log('MP Response status:', mpResponse.status);
    console.log('MP Response:', JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok) {
      console.error('MP Error:', mpData);
      return new Response(JSON.stringify({
        success: false,
        error: mpData.message || 'Erro ao criar preferência',
        details: mpData
      }), {
        status: mpResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Registrar transação pendente
    await supabase.from('mp_transactions').insert({
      establishment_id,
      type: 'sale',
      status: 'pending',
      amount,
      metadata: {
        order_id,
        preference_id: mpData.id,
        checkout_type: 'checkout_pro',
        binary_mode: true
      }
    });

    return new Response(JSON.stringify({
      success: true,
      preference_id: mpData.id,
      init_point: mpData.init_point,           // URL de produção
      sandbox_init_point: mpData.sandbox_init_point,  // URL de sandbox
      public_key: establishment.mp_public_key
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Checkout Pro error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
