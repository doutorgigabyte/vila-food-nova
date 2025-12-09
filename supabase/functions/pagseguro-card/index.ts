/**
 * PagBank/PagSeguro Card Payment - Checkout Transparente
 * 
 * Processa pagamentos com cartão de crédito/débito via API de Orders do PagBank.
 * Suporta split de pagamento para marketplace.
 * 
 * SECURITY: Requires valid order_id to process payments
 * 
 * Documentação: https://dev.pagbank.uol.com.br/reference/objeto-order
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAGSEGURO_ENVIRONMENT = Deno.env.get('PAGSEGURO_ENVIRONMENT') || 'sandbox';
const PLATFORM_ACCOUNT_ID = Deno.env.get('PAGSEGURO_PLATFORM_ACCOUNT_ID');
const PLATFORM_FEE_PERCENT = 5; // 5% taxa da plataforma

const API_BASE_URL = PAGSEGURO_ENVIRONMENT === 'production' 
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com';

interface CardPaymentRequest {
  establishment_id: string;
  order_id: string;
  amount: number;
  description?: string;
  encrypted_card: string;
  security_code: string;
  holder?: {
    name: string;
    tax_id?: string;
  };
  installments?: number;
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
  store_card?: boolean;
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

    const body: CardPaymentRequest = await req.json();
    const { 
      establishment_id, 
      order_id, 
      amount, 
      description, 
      encrypted_card,
      security_code,
      holder,
      installments = 1,
      customer, 
      items, 
      with_split,
      store_card = false
    } = body;

    // Validate required fields
    if (!establishment_id) {
      return new Response(JSON.stringify({ error: 'establishment_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id é obrigatório' }), {
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

    if (!encrypted_card) {
      return new Response(JSON.stringify({ error: 'Dados do cartão criptografados são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!security_code) {
      return new Response(JSON.stringify({ error: 'Código de segurança é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('PagBank Card request:', { 
      establishment_id, 
      order_id, 
      amount, 
      installments,
      environment: PAGSEGURO_ENVIRONMENT 
    });

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
      .select('pagseguro_token, pagseguro_account_id, name')
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment) {
      return new Response(JSON.stringify({ error: 'Estabelecimento não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!establishment.pagseguro_token) {
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
          type: 'CREDIT_CARD',
          installments,
          capture: true, // Captura automática
          card: {
            encrypted: encrypted_card,
            security_code,
            holder: {
              name: holder?.name || customer?.name || 'CLIENTE',
              tax_id: holder?.tax_id?.replace(/\D/g, '') || customer?.tax_id?.replace(/\D/g, '')
            },
            store: store_card
          }
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
          reason_code: 2,
          fee_share: {
            mode: 'AGREED',
            value: 0
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
        'x-idempotency-key': `${establishment_id}-${order_id}-card-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await pagbankResponse.json();

    if (!pagbankResponse.ok) {
      console.error('PagBank error:', orderData);
      
      // Parse error for user-friendly message
      const errorMessage = orderData.error_messages?.[0]?.description || 'Erro ao processar pagamento';
      const errorCode = orderData.error_messages?.[0]?.code;
      
      // Map common errors
      let userMessage = errorMessage;
      if (errorCode === '40001') userMessage = 'Dados do cartão inválidos';
      if (errorCode === '40002') userMessage = 'Cartão recusado. Verifique os dados ou tente outro cartão.';
      if (errorCode === '40003') userMessage = 'Transação não autorizada pelo banco emissor';
      if (errorCode === '40004') userMessage = 'Saldo insuficiente';
      
      return new Response(JSON.stringify({
        success: false,
        error: userMessage,
        error_code: errorCode,
        gateway: 'pagseguro',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('PagBank order created:', { 
      id: orderData.id, 
      status: orderData.charges?.[0]?.status 
    });

    const charge = orderData.charges?.[0];
    const chargeStatus = charge?.status;

    // Map status
    const statusMap: Record<string, string> = {
      'AUTHORIZED': 'approved',
      'PAID': 'approved',
      'IN_ANALYSIS': 'in_process',
      'DECLINED': 'rejected',
      'CANCELED': 'cancelled',
    };
    const paymentStatus = statusMap[chargeStatus] || 'pending';

    // Log transaction
    try {
      await supabase.from('mp_transactions').insert({
        establishment_id,
        order_id,
        type: 'card',
        status: paymentStatus,
        amount: amountInCents / 100,
        gateway: 'pagseguro',
        gateway_payment_id: orderData.id,
        metadata: {
          charge_id: charge?.id,
          charge_status: chargeStatus,
          installments,
          environment: PAGSEGURO_ENVIRONMENT,
        },
      });
    } catch (txError) {
      console.error('Error logging transaction:', txError);
    }

    // Update order status if approved
    if (paymentStatus === 'approved') {
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'card',
          payment_id: orderData.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id);
    }

    return new Response(JSON.stringify({
      success: paymentStatus === 'approved',
      payment_id: orderData.id,
      charge_id: charge?.id,
      status: paymentStatus,
      charge_status: chargeStatus,
      amount: amountInCents,
      installments,
      order_id,
      gateway: 'pagseguro',
      message: paymentStatus === 'approved' 
        ? '✅ Pagamento aprovado! Seu pedido foi confirmado.'
        : paymentStatus === 'in_process'
          ? '⏳ Pagamento em análise. Você será notificado quando for aprovado.'
          : '❌ Pagamento não aprovado. Por favor, tente outro cartão ou forma de pagamento.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PagBank Card error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      gateway: 'pagseguro',
      message: '❌ Erro ao processar pagamento. Por favor, tente novamente.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
