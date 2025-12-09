/**
 * Mercado Pago PIX - Checkout Transparente com Split
 * 
 * Gera QR codes PIX dinâmicos usando a API de Checkout Transparente do MP.
 * Usa o modelo Marketplace: pagamento via token da plataforma com split para vendedor.
 * 
 * https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing
 * https://www.mercadopago.com.br/developers/pt/docs/split-payment/integration-configuration/payments
 * 
 * SECURITY: Requires valid order_id to generate PIX codes
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform Access Token (from secrets)
const PLATFORM_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
const PLATFORM_FEE_PERCENT = 5; // 5% platform fee

interface PixRequest {
  establishment_id: string;
  order_id: string;
  amount: number;
  description?: string;
  payer_email?: string;
  payer_name?: string;
  payer_cpf?: string;
  external_reference?: string;
}

serve(async (req) => {
  console.log('[mercadopago-pix] ===== REQUEST START =====');
  console.log('[mercadopago-pix] Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: PixRequest = await req.json();
    const { 
      establishment_id, 
      order_id, 
      amount, 
      description, 
      payer_email, 
      payer_name,
      payer_cpf,
      external_reference 
    } = body;

    console.log('[mercadopago-pix] Request body:', JSON.stringify({
      establishment_id,
      order_id,
      amount,
      description,
      payer_email: payer_email ? '***@***' : null,
      payer_name: payer_name || null,
    }, null, 2));

    // Validate required fields
    if (!establishment_id) {
      console.error('[mercadopago-pix] ERROR: Missing establishment_id');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'establishment_id é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!order_id) {
      console.error('[mercadopago-pix] ERROR: Missing order_id');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'order_id é obrigatório para gerar PIX' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!amount || amount <= 0) {
      console.error('[mercadopago-pix] ERROR: Invalid amount:', amount);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Valor do pagamento inválido' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate order
    console.log('[mercadopago-pix] Validating order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, establishment_id, total, status, customer_phone, customer_id')
      .eq('id', order_id)
      .eq('establishment_id', establishment_id)
      .single();

    if (orderError || !order) {
      console.error('[mercadopago-pix] ERROR: Order validation failed:', orderError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Pedido não encontrado ou não pertence ao estabelecimento',
        details: orderError?.message
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[mercadopago-pix] Order found:', { 
      id: order.id, 
      status: order.status, 
      total: order.total,
      customer_id: order.customer_id 
    });

    if (order.status === 'cancelled' || order.status === 'delivered') {
      console.error('[mercadopago-pix] ERROR: Invalid order status:', order.status);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Pedido não pode receber pagamento neste status' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get establishment with MP config
    console.log('[mercadopago-pix] Fetching establishment...');
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('mercado_pago_token, mp_user_id, name, pix_key')
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment) {
      console.error('[mercadopago-pix] ERROR: Establishment not found:', estError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Estabelecimento não encontrado',
        details: estError?.message
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[mercadopago-pix] Establishment found:', {
      name: establishment.name,
      has_mp_token: !!establishment.mercado_pago_token,
      has_mp_user_id: !!establishment.mp_user_id,
      has_pix_key: !!establishment.pix_key,
      has_platform_token: !!PLATFORM_ACCESS_TOKEN,
    });

    // Determine which token to use
    // Priority: Platform token with split > Establishment token > Static PIX
    let accessToken = PLATFORM_ACCESS_TOKEN;
    let useSplit = false;
    let sellerId = establishment.mp_user_id;

    // If we have platform token and seller is connected, use split payment
    if (PLATFORM_ACCESS_TOKEN && establishment.mp_user_id) {
      accessToken = PLATFORM_ACCESS_TOKEN;
      useSplit = true;
      console.log('[mercadopago-pix] Using platform token with split to seller:', sellerId);
    } 
    // If only establishment token, use it directly (legacy mode)
    else if (establishment.mercado_pago_token) {
      accessToken = establishment.mercado_pago_token;
      useSplit = false;
      console.log('[mercadopago-pix] Using establishment token directly (legacy)');
    }
    // No MP configured, fallback to static PIX
    else if (establishment.pix_key) {
      console.log('[mercadopago-pix] No MP token, returning static PIX');
      return new Response(JSON.stringify({
        success: true,
        type: 'static_pix',
        pix_key: establishment.pix_key,
        amount,
        description,
        order_id,
        message: `💰 *Pagamento via PIX*\n\nValor: R$ ${amount.toFixed(2)}\n\nChave PIX: ${establishment.pix_key}\n\nApós o pagamento, envie o comprovante para confirmarmos seu pedido! 📸`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('[mercadopago-pix] ERROR: No payment method configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Pagamento PIX não configurado',
        message: 'Este estabelecimento ainda não configurou o pagamento via PIX.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare payer info
    const payerFirstName = payer_name?.split(' ')[0] || 'Cliente';
    const payerLastName = payer_name?.split(' ').slice(1).join(' ') || 'VilaFood';
    const payerEmail = payer_email || `cliente_${order_id.slice(-8)}@vilafood.com.br`;
    
    // Calculate platform fee for split
    const platformFee = useSplit ? Math.round(amount * PLATFORM_FEE_PERCENT) / 100 : 0;

    // Build Mercado Pago payment payload
    const mpPayload: Record<string, unknown> = {
      transaction_amount: Number(amount.toFixed(2)),
      description: description || `Pedido ${establishment.name} #${order_id.slice(-8)}`,
      payment_method_id: 'pix',
      payer: {
        email: payerEmail,
        first_name: payerFirstName,
        last_name: payerLastName,
      },
      external_reference: external_reference || order_id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

    // Add CPF if provided
    if (payer_cpf) {
      (mpPayload.payer as Record<string, unknown>).identification = {
        type: 'CPF',
        number: payer_cpf.replace(/\D/g, ''),
      };
    }

    // Add split payment configuration if using platform token
    // Note: For PIX, split payments are handled differently via bank transfers after payment
    // application_fee doesn't work with PIX, so we'll handle splits in the webhook
    if (useSplit && sellerId) {
      console.log('[mercadopago-pix] Split will be processed after payment via webhook:', {
        platform_fee: platformFee,
        seller_receives: amount - platformFee,
        seller_id: sellerId,
      });
    }

    console.log('[mercadopago-pix] Creating MP payment with payload:', JSON.stringify({
      ...mpPayload,
      payer: { ...mpPayload.payer as object, email: '***@***' }
    }, null, 2));

    // Generate idempotency key
    const idempotencyKey = `pix_${establishment_id}_${order_id}_${Date.now()}`;
    
    console.log('[mercadopago-pix] Calling Mercado Pago API...');
    console.log('[mercadopago-pix] Token type:', useSplit ? 'PLATFORM' : 'ESTABLISHMENT');
    console.log('[mercadopago-pix] Token prefix:', accessToken?.substring(0, 20) + '...');
    
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(mpPayload),
    });

    console.log('[mercadopago-pix] MP Response status:', mpResponse.status);

    const responseText = await mpResponse.text();
    console.log('[mercadopago-pix] MP Response body:', responseText);

    let paymentData;
    try {
      paymentData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[mercadopago-pix] ERROR: Failed to parse MP response:', parseError);
      throw new Error('Resposta inválida do Mercado Pago');
    }

    if (!mpResponse.ok) {
      console.error('[mercadopago-pix] ERROR: MP API error:', paymentData);
      
      const errorCode = paymentData.code || '';
      const isAuthError = errorCode.includes('UNAUTHORIZED') || 
                          mpResponse.status === 401 || 
                          mpResponse.status === 403;
      
      let errorMessage = paymentData.message || 
        paymentData.cause?.[0]?.description || 
        paymentData.error ||
        'Erro ao criar pagamento PIX';

      if (isAuthError) {
        errorMessage = 'Token do Mercado Pago sem permissão. Verifique as configurações.';
      }
      
      // Fallback to static PIX if available
      if (establishment.pix_key) {
        console.log('[mercadopago-pix] Falling back to static PIX');
        return new Response(JSON.stringify({
          success: true,
          type: 'static_pix',
          pix_key: establishment.pix_key,
          amount,
          description,
          order_id,
          mp_error: errorMessage,
          message: `💰 *Pagamento via PIX*\n\nValor: R$ ${amount.toFixed(2)}\n\nChave PIX: ${establishment.pix_key}\n\nApós o pagamento, envie o comprovante para confirmarmos seu pedido! 📸`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(errorMessage);
    }

    console.log('[mercadopago-pix] Payment created successfully:', {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      date_of_expiration: paymentData.date_of_expiration,
    });

    // Extract PIX data
    const pixData = paymentData.point_of_interaction?.transaction_data;
    
    console.log('[mercadopago-pix] PIX data available:', {
      has_point_of_interaction: !!paymentData.point_of_interaction,
      has_transaction_data: !!pixData,
      has_qr_code: !!pixData?.qr_code,
      has_qr_code_base64: !!pixData?.qr_code_base64,
      qr_code_length: pixData?.qr_code?.length || 0,
    });

    if (!pixData || !pixData.qr_code) {
      console.error('[mercadopago-pix] ERROR: PIX data not found in response');
      
      if (establishment.pix_key) {
        console.log('[mercadopago-pix] Falling back to static PIX (no QR in response)');
        return new Response(JSON.stringify({
          success: true,
          type: 'static_pix',
          pix_key: establishment.pix_key,
          amount,
          description,
          order_id,
          payment_id: paymentData.id,
          message: `💰 *Pagamento via PIX*\n\nValor: R$ ${amount.toFixed(2)}\n\nChave PIX: ${establishment.pix_key}\n\nApós o pagamento, envie o comprovante para confirmarmos seu pedido! 📸`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error('QR Code PIX não encontrado na resposta do Mercado Pago');
    }

    // Log transaction
    try {
      await supabase.from('mp_transactions').insert({
        establishment_id,
        type: 'pix',
        status: paymentData.status,
        mp_payment_id: paymentData.id?.toString(),
        amount,
        metadata: {
          order_id,
          expiration: paymentData.date_of_expiration,
          platform_fee: platformFee,
          use_split: useSplit,
        },
      });
    } catch (txError) {
      console.error('[mercadopago-pix] Transaction log error (non-blocking):', txError);
    }

    // Log analytics
    try {
      await supabase.from('whatsapp_analytics').insert({
        establishment_id,
        event_type: 'pix_generated',
        event_data: {
          payment_id: paymentData.id,
          order_id,
          amount,
          status: paymentData.status,
          type: 'dynamic_pix',
          use_split: useSplit,
        },
      });
    } catch (analyticsError) {
      console.error('[mercadopago-pix] Analytics error (non-blocking):', analyticsError);
    }

    console.log('[mercadopago-pix] ===== SUCCESS =====');
    console.log('[mercadopago-pix] Returning QR Code with', pixData.qr_code_base64?.length || 0, 'bytes');

    return new Response(JSON.stringify({
      success: true,
      type: 'dynamic_pix',
      payment_id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      qr_code: pixData.qr_code,
      qr_code_base64: pixData.qr_code_base64,
      qr_code_url: pixData.qr_code_base64 ? `data:image/png;base64,${pixData.qr_code_base64}` : null,
      ticket_url: pixData.ticket_url,
      amount,
      order_id,
      platform_fee: platformFee,
      expiration: paymentData.date_of_expiration,
      message: `💰 *Pagamento via PIX*\n\nValor: R$ ${amount.toFixed(2)}\n\n📱 Escaneie o QR Code ou copie o código PIX\n\n⏰ Válido até: ${new Date(paymentData.date_of_expiration).toLocaleString('pt-BR')}\n\nO pedido será confirmado automaticamente após o pagamento!`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[mercadopago-pix] ===== ERROR =====');
    console.error('[mercadopago-pix] Exception:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: '❌ Erro ao gerar PIX. Por favor, tente novamente ou escolha outra forma de pagamento.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
