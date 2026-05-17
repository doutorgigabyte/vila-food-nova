import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de categorias do sistema para categorias do MP
const MP_CATEGORIES: Record<string, string> = {
  'pizza': 'pizza',
  'pizzas': 'pizza',
  'sushi': 'sushi',
  'japones': 'sushi',
  'lanche': 'fast_food',
  'lanches': 'fast_food',
  'hamburguer': 'fast_food',
  'burger': 'fast_food',
  'doce': 'sweets',
  'doces': 'sweets',
  'sobremesa': 'sweets',
  'bolo': 'sweets',
  'torta': 'sweets',
  'sorvete': 'ice_cream',
  'açaí': 'ice_cream',
  'acai': 'ice_cream',
  'bebida': 'drinks',
  'bebidas': 'drinks',
  'cafe': 'coffee',
  'café': 'coffee',
  'padaria': 'bakery',
  'default': 'food',
};

function getMPCategory(categoryName?: string): string {
  if (!categoryName) return 'food';
  const normalized = categoryName.toLowerCase().trim();
  for (const [key, value] of Object.entries(MP_CATEGORIES)) {
    if (normalized.includes(key)) return value;
  }
  return 'food';
}

interface CheckoutItem {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  quantity: number;
  unit_price: number;
  picture_url?: string;
}

interface CheckoutProRequest {
  order_id: string;
  establishment_id: string;
  amount: number;
  description: string;
  items?: CheckoutItem[];
  payer?: {
    email?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    identification?: {
      type?: string;
      number?: string;
    };
    address?: {
      zip_code?: string;
      street_name?: string;
      street_number?: string;
      neighborhood?: string;
      city?: string;
      federal_unit?: string;
    };
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  shipments?: {
    cost?: number;
    mode?: string;
  };
  device_id?: string; // Device fingerprint para prevenção de fraudes
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CheckoutProRequest = await req.json();
    const { order_id, establishment_id, amount, description, items, payer, back_urls, shipments, device_id } = requestData;

    // Get origin from request for back_urls
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://vilafood.delivery';

    console.log('=== CHECKOUT PRO REQUEST ===');
    console.log('Order ID:', order_id);
    console.log('Establishment ID:', establishment_id);
    console.log('Amount:', amount);
    console.log('Origin:', origin);
    console.log('Items count:', items?.length || 0);
    console.log('Device ID:', device_id ? 'present' : 'missing');
    console.log('Payer email:', payer?.email ? 'present' : 'missing');

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

    // SECURITY: validar que o pedido existe, pertence ao estabelecimento e
    // que o valor solicitado bate com o total no DB. Sem isso, atacante muda
    // o `amount` no devtools e paga 1 centavo por um pedido de R$100.
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, establishment_id, total, status')
      .eq('id', order_id)
      .eq('establishment_id', establishment_id)
      .single();

    if (orderError || !order) {
      console.error('[checkout-pro] Order validation failed:', { order_id, establishment_id, error: orderError });
      return new Response(JSON.stringify({
        success: false,
        error: 'Pedido não encontrado ou não pertence a este estabelecimento'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (order.status === 'confirmed' || order.status === 'preparing' || order.status === 'delivered') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Este pedido já foi pago'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (Math.abs(Number(amount) - Number(order.total)) > 0.01) {
      console.error('[checkout-pro] AMOUNT_TAMPERING', {
        requested: amount,
        db_total: order.total,
        order_id,
        establishment_id,
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Valor solicitado não corresponde ao total do pedido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('mercado_pago_token, mp_public_key, name, segment_id')
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

    // Buscar segmento para categoria padrão
    let defaultCategory = 'food';
    if (establishment.segment_id) {
      const { data: segment } = await supabase
        .from('segments')
        .select('name')
        .eq('id', establishment.segment_id)
        .single();
      if (segment) {
        defaultCategory = getMPCategory(segment.name);
      }
    }

    // PRODUÇÃO: Priorizar token da plataforma, depois token do estabelecimento
    const platformToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    const accessToken = platformToken || establishment.mercado_pago_token;
    
    console.log('Using token source:', platformToken ? 'PLATFORM' : 'ESTABLISHMENT');
    
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

    // Construir items para a preferência com TODOS os campos recomendados pelo MP
    const preferenceItems = items && items.length > 0 
      ? items.map(item => ({
          id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title.substring(0, 256), // Max 256 chars
          description: (item.description || item.title).substring(0, 256),
          category_id: item.category_id || getMPCategory(item.title) || defaultCategory,
          quantity: item.quantity,
          unit_price: Number(item.unit_price.toFixed(2)),
          currency_id: 'BRL',
          ...(item.picture_url && { picture_url: item.picture_url })
        }))
      : [{
          id: `order-${order_id}`,
          title: (description || `Pedido ${establishment.name}`).substring(0, 256),
          description: (description || `Pedido realizado em ${establishment.name}`).substring(0, 256),
          category_id: defaultCategory,
          quantity: 1,
          unit_price: Number(amount.toFixed(2)),
          currency_id: 'BRL'
        }];

    // Construir dados do pagador com TODOS os campos obrigatórios e recomendados
    const payerData: Record<string, unknown> = {};
    
    if (payer) {
      // Email é OBRIGATÓRIO - criar fallback se não fornecido
      payerData.email = payer.email || `cliente_${order_id.slice(-8)}@vilafood.com.br`;
      
      // Nome separado em first_name e last_name (RECOMENDADO)
      if (payer.first_name) {
        payerData.first_name = payer.first_name;
      } else if (payer.name) {
        const nameParts = payer.name.split(' ');
        payerData.first_name = nameParts[0];
        if (nameParts.length > 1) {
          payerData.last_name = nameParts.slice(1).join(' ');
        }
      }
      
      if (payer.last_name) {
        payerData.last_name = payer.last_name;
      }
      
      // Telefone (BOA PRÁTICA)
      if (payer.phone) {
        const cleanPhone = payer.phone.replace(/\D/g, '');
        if (cleanPhone.length >= 10) {
          payerData.phone = { 
            area_code: cleanPhone.substring(0, 2),
            number: cleanPhone.substring(2)
          };
        }
      }
      
      // Identificação CPF/CNPJ (BOA PRÁTICA)
      if (payer.identification?.number) {
        const cleanDoc = payer.identification.number.replace(/\D/g, '');
        payerData.identification = {
          type: payer.identification.type || (cleanDoc.length > 11 ? 'CNPJ' : 'CPF'),
          number: cleanDoc
        };
      }
      
      // Endereço completo (BOA PRÁTICA)
      if (payer.address) {
        const address: Record<string, string> = {};
        if (payer.address.zip_code) address.zip_code = payer.address.zip_code.replace(/\D/g, '');
        if (payer.address.street_name) address.street_name = payer.address.street_name;
        if (payer.address.street_number) address.street_number = payer.address.street_number;
        // Campos adicionais para melhorar validação
        if (payer.address.neighborhood) address.neighborhood = payer.address.neighborhood;
        if (payer.address.city) address.city = payer.address.city;
        if (payer.address.federal_unit) address.federal_unit = payer.address.federal_unit;
        
        if (Object.keys(address).length > 0) {
          payerData.address = address;
        }
      }
    } else {
      // Criar email fallback mesmo sem dados do payer
      payerData.email = `cliente_${order_id.slice(-8)}@vilafood.com.br`;
    }

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
      
      // Nome na fatura do cartão (RECOMENDADO para reduzir contestações)
      statement_descriptor: 'VILA FOOD',
      
      // Referência externa para reconciliação
      external_reference: order_id,
      
      // Webhook de notificação
      // MP exige URL publica HTTPS. SUPABASE_URL no container e privado.
      notification_url: `${Deno.env.get('EXTERNAL_SUPABASE_URL') || supabaseUrl}/functions/v1/mercadopago-webhook`,
      
      // Dados do pagador (OBRIGATÓRIO: email)
      payer: payerData,
    };

    // Adicionar frete se disponível
    if (shipments?.cost && shipments.cost > 0) {
      preferencePayload.shipments = {
        cost: Number(shipments.cost.toFixed(2)),
        mode: shipments.mode || 'not_specified'
      };
    }

    // Metadados adicionais para tracking
    preferencePayload.metadata = {
      order_id,
      establishment_id,
      platform: 'vilafood',
      ...(device_id && { device_id }),
    };

    console.log('Creating preference with payload:', JSON.stringify({
      ...preferencePayload,
      payer: { ...payerData, email: payerData.email ? '***@***' : undefined }
    }, null, 2));

    // Headers para a requisição ao MP
    const mpHeaders: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `checkout-pro-${order_id}-${Date.now()}`
    };

    // Adicionar Device ID nos headers se disponível (OBRIGATÓRIO para aprovação)
    if (device_id) {
      mpHeaders['X-meli-session-id'] = device_id;
    }

    // Criar preferência no Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: mpHeaders,
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
        binary_mode: true,
        items_count: preferenceItems.length,
        has_device_id: !!device_id,
        payer_email_provided: !!payer?.email,
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
