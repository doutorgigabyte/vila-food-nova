/**
 * PagBank/PagSeguro PIX - Geração de QR Code PIX via Orders API
 * 
 * Gera QR codes PIX dinâmicos para pagamento de pedidos usando a API de Orders do PagBank.
 * Suporta split de pagamento para marketplace.
 * 
 * SECURITY: Requires valid order_id to generate PIX codes
 * 
 * Documentação: https://dev.pagbank.uol.com.br/reference/objeto-order
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PRODUÇÃO: Definir PAGSEGURO_ENVIRONMENT=production nos secrets
const PAGSEGURO_ENVIRONMENT = Deno.env.get('PAGSEGURO_ENVIRONMENT') || 'sandbox';
const PLATFORM_ACCOUNT_ID = Deno.env.get('PAGSEGURO_PLATFORM_ACCOUNT_ID');
const PLATFORM_FEE_PERCENT = 5; // 5% taxa da plataforma

const API_BASE_URL = PAGSEGURO_ENVIRONMENT === 'production' 
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com';

console.log(`PagSeguro PIX running in ${PAGSEGURO_ENVIRONMENT} mode, API: ${API_BASE_URL}`);

interface PixRequest {
  establishment_id: string;
  order_id: string;
  amount: number;
  description?: string;
  customer?: {
    name?: string;
    email?: string;
    tax_id?: string;
    phone?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    unit_amount: number;
  }>;
  with_split?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: PixRequest = await req.json();
    const { establishment_id, order_id, amount, description, customer, items, with_split } = body;

    // Validate required fields
    if (!establishment_id) {
      return new Response(JSON.stringify({ error: 'establishment_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id é obrigatório para gerar PIX' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Valor do pagamento inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('PagBank PIX request:', { establishment_id, order_id, amount, environment: PAGSEGURO_ENVIRONMENT });

    // Validate order exists and belongs to establishment
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, establishment_id, total, status')
      .eq('id', order_id)
      .eq('establishment_id', establishment_id)
      .single();

    if (orderError || !order) {
      console.error('Order validation failed:', orderError);
      return new Response(JSON.stringify({ error: 'Pedido não encontrado ou não pertence ao estabelecimento' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.status === 'cancelled' || order.status === 'delivered') {
      return new Response(JSON.stringify({ error: 'Pedido não pode receber pagamento neste status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get establishment's PagBank token
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('pagseguro_token, pagseguro_account_id, name, pix_key')
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment) {
      return new Response(JSON.stringify({ error: 'Estabelecimento não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if establishment has PagBank configured
    if (!establishment.pagseguro_token) {
      // Fallback to static PIX if available
      if (establishment.pix_key) {
        return new Response(JSON.stringify({
          success: true,
          type: 'static_pix',
          pix_key: establishment.pix_key,
          amount,
          description,
          order_id,
          gateway: 'pagseguro',
          message: `💰 *Pagamento via PIX*\n\nValor: R$ ${(amount / 100).toFixed(2)}\n\nChave PIX: ${establishment.pix_key}\n\nApós o pagamento, envie o comprovante para confirmarmos seu pedido! 📸`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Pagamento PagBank não configurado',
        message: 'Este estabelecimento ainda não configurou o pagamento via PagBank.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Amount in centavos
    const amountInCents = Math.round(amount);

    // Build order payload for PagBank
    const orderPayload: any = {
      reference_id: order_id,
      customer: {
        name: customer?.name || 'Cliente',
        email: customer?.email || 'cliente@email.com',
        tax_id: customer?.tax_id?.replace(/\D/g, '') || '12345678909',
        phones: customer?.phone ? [{
          country: '55',
          area: customer.phone.substring(0, 2),
          number: customer.phone.substring(2),
          type: 'MOBILE'
        }] : undefined
      },
      items: items || [{
        name: description || `Pedido ${establishment.name}`,
        quantity: 1,
        unit_amount: amountInCents
      }],
      charges: [{
        reference_id: `charge-${order_id}`,
        description: description || `Pagamento do Pedido - ${establishment.name}`,
        amount: {
          value: amountInCents,
          currency: 'BRL'
        },
        payment_method: {
          type: 'PIX'
        }
      }]
    };

    // Add split if platform account is configured and split is requested
    if (with_split && PLATFORM_ACCOUNT_ID) {
      const platformFee = Math.round(amountInCents * (PLATFORM_FEE_PERCENT / 100));
      
      orderPayload.charges[0].splits = {
        method: 'FIXED',
        receivers: [{
          account: {
            id: PLATFORM_ACCOUNT_ID
          },
          amount: {
            value: platformFee
          },
          reason_code: 2, // Secondary Receiver (Comissionado)
          fee_share: {
            mode: 'AGREED',
            value: 0 // Vendedor paga a taxa do PagBank
          }
        }]
      };

      console.log('Split configured:', { platform_fee: platformFee, vendor_receives: amountInCents - platformFee });
    }

    // Create order via PagBank API
    const pagbankResponse = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${establishment.pagseguro_token}`,
        'Content-Type': 'application/json',
        'x-idempotency-key': `${establishment_id}-${order_id}-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!pagbankResponse.ok) {
      const errorData = await pagbankResponse.json();
      console.error('PagBank error:', errorData);
      
      // Fallback to static PIX if available
      if (establishment.pix_key) {
        return new Response(JSON.stringify({
          success: true,
          type: 'static_pix',
          pix_key: establishment.pix_key,
          amount: amountInCents,
          description,
          order_id,
          gateway: 'pagseguro',
          message: `💰 *Pagamento via PIX*\n\nValor: R$ ${(amountInCents / 100).toFixed(2)}\n\nChave PIX: ${establishment.pix_key}\n\nApós o pagamento, envie o comprovante para confirmarmos seu pedido! 📸`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(errorData.error_messages?.[0]?.description || 'Erro ao criar pagamento PIX');
    }

    const orderData = await pagbankResponse.json();
    console.log('PagBank order created:', { id: orderData.id, status: orderData.charges?.[0]?.status });

    // Extract PIX data from charge
    const charge = orderData.charges?.[0];
    const pixData = charge?.payment_method?.pix;
    const qrCodes = charge?.links?.filter((l: any) => l.media === 'application/qrcode' || l.rel === 'PAY');

    if (!pixData && !qrCodes?.length) {
      console.error('PIX data not found in order response:', orderData);
      
      if (establishment.pix_key) {
        return new Response(JSON.stringify({
          success: true,
          type: 'static_pix',
          pix_key: establishment.pix_key,
          amount: amountInCents,
          description,
          order_id,
          gateway: 'pagseguro',
          message: `💰 *Pagamento via PIX*\n\nValor: R$ ${(amountInCents / 100).toFixed(2)}\n\nChave PIX: ${establishment.pix_key}\n\nApós o pagamento, envie o comprovante para confirmarmos seu pedido! 📸`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error('Dados PIX não encontrados na resposta do PagBank');
    }

    // Log transaction
    // type='sale' (constraint do DB so aceita subscription/sale/payout/refund).
    // Payment method e gateway ficam em metadata.
    try {
      const { error: txError } = await supabase.from('mp_transactions').insert({
        establishment_id,
        order_id,
        type: 'sale',
        status: charge?.status || 'WAITING',
        amount: amountInCents / 100,
        gateway: 'pagseguro',
        gateway_payment_id: orderData.id,
        metadata: {
          payment_method: 'pix',
          charge_id: charge?.id,
          environment: PAGSEGURO_ENVIRONMENT,
        },
      });
      if (txError) {
        console.error('[pagseguro-pix] Error logging transaction:', txError);
      }
    } catch (txError) {
      console.error('[pagseguro-pix] Transaction log exception:', txError);
    }

    // Build response
    const qrCode = pixData?.text || pixData?.payload;
    const qrCodeUrl = qrCodes?.find((l: any) => l.media === 'image/png')?.href;
    const expiration = pixData?.expiration_date || charge?.payment_response?.raw_data?.expiration_date;

    return new Response(JSON.stringify({
      success: true,
      type: 'dynamic_pix',
      payment_id: orderData.id,
      charge_id: charge?.id,
      status: charge?.status,
      qr_code: qrCode,
      qr_code_url: qrCodeUrl,
      amount: amountInCents,
      order_id,
      gateway: 'pagseguro',
      expiration,
      message: `💰 *Pagamento via PIX*\n\nValor: R$ ${(amountInCents / 100).toFixed(2)}\n\n📱 Escaneie o QR Code ou copie o código abaixo:\n\n\`\`\`${qrCode}\`\`\`\n\n⏰ Válido por 30 minutos\n\nO pedido será confirmado automaticamente após o pagamento!`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PagBank PIX error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      gateway: 'pagseguro',
      message: '❌ Erro ao gerar PIX. Por favor, tente novamente ou escolha outra forma de pagamento.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
