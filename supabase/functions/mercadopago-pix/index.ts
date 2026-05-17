/**
 * Mercado Pago PIX - Checkout Transparente com Split (Modelo Blindado)
 * 
 * Gera QR codes PIX dinâmicos usando a API de Checkout Transparente do MP.
 * 
 * MODELO BLINDADO - Plataforma como SaaS:
 * - 100% do FRETE vai para a LOJA (establishment)
 * - Plataforma recebe apenas: 5% do valor dos PRODUTOS (taxa de serviço desativada)
 * - Loja é responsável por pagar o entregador diretamente
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
const PLATFORM_FEE_PERCENT = 0; // 5% platform fee DISABLED - set to 5 to reactivate (only on PRODUCTS, not delivery)
const PLATFORM_SERVICE_FEE = 0; // Service fee DISABLED - subscription-only model

// Mapeamento de categorias do sistema para categorias do MP
const MP_CATEGORIES: Record<string, string> = {
  'pizza': 'pizza', 'pizzas': 'pizza', 'sushi': 'sushi', 'japones': 'sushi',
  'lanche': 'fast_food', 'lanches': 'fast_food', 'hamburguer': 'fast_food', 'burger': 'fast_food',
  'doce': 'sweets', 'doces': 'sweets', 'sobremesa': 'sweets', 'bolo': 'sweets', 'torta': 'sweets',
  'sorvete': 'ice_cream', 'açaí': 'ice_cream', 'acai': 'ice_cream',
  'bebida': 'drinks', 'bebidas': 'drinks', 'cafe': 'coffee', 'café': 'coffee',
  'padaria': 'bakery', 'default': 'food',
};

function getMPCategory(categoryName?: string): string {
  if (!categoryName) return 'food';
  const normalized = categoryName.toLowerCase().trim();
  for (const [key, value] of Object.entries(MP_CATEGORIES)) {
    if (normalized.includes(key)) return value;
  }
  return 'food';
}

interface PixItem {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  quantity: number;
  unit_price: number;
}

interface PixRequest {
  establishment_id: string;
  order_id: string;
  amount: number; // Total amount including delivery
  products_amount?: number; // Amount of products only (without delivery)
  delivery_fee?: number; // Delivery fee amount
  description?: string;
  payer_email?: string;
  payer_name?: string;
  payer_cpf?: string;
  payer_phone?: string;
  payer_address?: {
    zip_code?: string;
    street_name?: string;
    street_number?: string;
    neighborhood?: string;
    city?: string;
    federal_unit?: string;
  };
  items?: PixItem[];
  device_id?: string; // Device fingerprint
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
      products_amount,
      delivery_fee, 
      description, 
      payer_email, 
      payer_name,
      payer_cpf,
      payer_phone,
      payer_address,
      items,
      device_id,
      external_reference 
    } = body;

    console.log('[mercadopago-pix] Request body:', JSON.stringify({
      establishment_id,
      order_id,
      amount,
      products_amount,
      delivery_fee,
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

    // SECURITY: enforce server-side que o valor solicitado bate com o total
    // do pedido no DB. Sem isso, um atacante muda o `amount` no devtools e
    // paga 1 centavo por um pedido de R$100.
    if (Math.abs(Number(amount) - Number(order.total)) > 0.01) {
      console.error('[mercadopago-pix] AMOUNT_TAMPERING', {
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
    
    // MODELO BLINDADO - Calculate platform fee correctly:
    // Platform receives: 5% of PRODUCTS only + R$1 service fee
    // Establishment receives: 100% of delivery fee + (products - 5% - R$1)
    const actualProductsAmount = products_amount || (amount - (delivery_fee || 0));
    const actualDeliveryFee = delivery_fee || 0;
    
    // Platform fee = 5% of products + R$1 service fee
    const platformProductFee = useSplit ? Math.round(actualProductsAmount * PLATFORM_FEE_PERCENT) / 100 : 0;
    const platformServiceFee = useSplit ? PLATFORM_SERVICE_FEE : 0;
    const totalPlatformFee = platformProductFee + platformServiceFee;
    
    // Establishment receives = Total - Platform fee (includes 100% of delivery)
    const establishmentReceives = amount - totalPlatformFee;

    console.log('[mercadopago-pix] MODELO BLINDADO Split calculation:', {
      total_amount: amount,
      products_amount: actualProductsAmount,
      delivery_fee: actualDeliveryFee,
      platform_product_fee_5pct: platformProductFee,
      platform_service_fee: platformServiceFee,
      total_platform_fee: totalPlatformFee,
      establishment_receives: establishmentReceives,
      note: '100% do frete vai para a loja - loja paga entregador',
    });

    // Build payer object with ALL recommended fields
    const payerData: Record<string, unknown> = {
      email: payerEmail,
      first_name: payerFirstName,
      last_name: payerLastName,
    };

    // Add CPF if provided (BOA PRÁTICA)
    if (payer_cpf) {
      const cleanCpf = payer_cpf.replace(/\D/g, '');
      payerData.identification = {
        type: cleanCpf.length > 11 ? 'CNPJ' : 'CPF',
        number: cleanCpf,
      };
    }

    // Add phone if provided (BOA PRÁTICA)
    if (payer_phone) {
      const cleanPhone = payer_phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        payerData.phone = {
          area_code: cleanPhone.substring(0, 2),
          number: cleanPhone.substring(2),
        };
      }
    }

    // Add address if provided (BOA PRÁTICA)
    if (payer_address) {
      const address: Record<string, string> = {};
      if (payer_address.zip_code) address.zip_code = payer_address.zip_code.replace(/\D/g, '');
      if (payer_address.street_name) address.street_name = payer_address.street_name;
      if (payer_address.street_number) address.street_number = payer_address.street_number;
      if (payer_address.neighborhood) address.neighborhood = payer_address.neighborhood;
      if (payer_address.city) address.city = payer_address.city;
      if (payer_address.federal_unit) address.federal_unit = payer_address.federal_unit;
      if (Object.keys(address).length > 0) {
        payerData.address = address;
      }
    }

    // Build items array with ALL recommended fields
    const paymentItems = items && items.length > 0
      ? items.map(item => ({
          id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title.substring(0, 256),
          description: (item.description || item.title).substring(0, 256),
          category_id: item.category_id || getMPCategory(item.title),
          quantity: item.quantity,
          unit_price: Number(item.unit_price.toFixed(2)),
        }))
      : [{
          id: `order-${order_id}`,
          title: (description || `Pedido ${establishment.name}`).substring(0, 256),
          description: (description || `Pedido #${order_id.slice(-8)}`).substring(0, 256),
          category_id: 'food',
          quantity: 1,
          unit_price: Number(amount.toFixed(2)),
        }];

    // Build Mercado Pago payment payload with ALL required and recommended fields
    const mpPayload: Record<string, unknown> = {
      transaction_amount: Number(amount.toFixed(2)),
      description: description || `Pedido ${establishment.name} #${order_id.slice(-8)}`,
      payment_method_id: 'pix',
      payer: payerData,
      // RECOMENDADO: Items para melhor aprovação
      additional_info: {
        items: paymentItems,
        payer: {
          first_name: payerFirstName,
          last_name: payerLastName,
          ...(payer_phone && {
            phone: {
              area_code: payer_phone.replace(/\D/g, '').substring(0, 2),
              number: payer_phone.replace(/\D/g, '').substring(2),
            }
          }),
          ...(payer_address && {
            address: {
              zip_code: payer_address.zip_code?.replace(/\D/g, ''),
              street_name: payer_address.street_name,
              street_number: payer_address.street_number,
            }
          }),
        },
      },
      // RECOMENDADO: Nome na fatura
      statement_descriptor: 'VILA FOOD',
      external_reference: external_reference || order_id,
      // MP exige URL publica HTTPS. SUPABASE_URL aqui dentro do container vale
      // http://supabase-kong:8000 (privado). EXTERNAL_SUPABASE_URL deve ser a
      // URL publica HTTPS do projeto (ex: https://db.vilafood.delivery).
      notification_url: `${Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      // Metadados
      metadata: {
        order_id,
        establishment_id,
        platform: 'vilafood',
        ...(device_id && { device_id }),
      },
    };

    // Add split payment configuration if using platform token
    if (useSplit && sellerId) {
      console.log('[mercadopago-pix] MODELO BLINDADO - Split will be processed after payment via webhook:', {
        platform_fee: totalPlatformFee,
        establishment_receives: establishmentReceives,
        seller_id: sellerId,
        delivery_fee_to_establishment: actualDeliveryFee,
        note: 'Loja recebe 100% do frete + produtos menos comissão',
      });
    }

    console.log('[mercadopago-pix] Creating MP payment with payload:', JSON.stringify({
      ...mpPayload,
      payer: { ...mpPayload.payer as object, email: '***@***' },
      additional_info: '...',
    }, null, 2));

    // Generate idempotency key
    const idempotencyKey = `pix_${establishment_id}_${order_id}_${Date.now()}`;
    
    console.log('[mercadopago-pix] Calling Mercado Pago API...');
    console.log('[mercadopago-pix] Token type:', useSplit ? 'PLATFORM' : 'ESTABLISHMENT');
    console.log('[mercadopago-pix] Token prefix:', accessToken?.substring(0, 20) + '...');
    console.log('[mercadopago-pix] Device ID:', device_id ? 'present' : 'missing');

    // Headers com Device ID se disponível
    const mpHeaders: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    };

    // OBRIGATÓRIO: Device ID para prevenção de fraudes
    if (device_id) {
      mpHeaders['X-meli-session-id'] = device_id;
    }
    
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: mpHeaders,
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

    // Log transaction with MODELO BLINDADO details
    // type='sale' (constraint do DB so aceita subscription/sale/payout/refund).
    // O detalhe de ser PIX fica em metadata.payment_method.
    try {
      const { error: txError } = await supabase.from('mp_transactions').insert({
        establishment_id,
        type: 'sale',
        status: paymentData.status,
        mp_payment_id: paymentData.id?.toString(),
        order_id,
        amount,
        platform_fee: totalPlatformFee,
        net_amount: establishmentReceives,
        metadata: {
          payment_method: 'pix',
          order_id,
          expiration: paymentData.date_of_expiration,
          platform_product_fee: platformProductFee,
          platform_service_fee: platformServiceFee,
          delivery_fee: actualDeliveryFee,
          products_amount: actualProductsAmount,
          use_split: useSplit,
          modelo: 'blindado',
        },
      });
      if (txError) {
        console.error('[mercadopago-pix] Transaction log error (non-blocking):', txError);
      }
    } catch (txError) {
      console.error('[mercadopago-pix] Transaction log exception (non-blocking):', txError);
    }

    // Persistir QR no proprio order pra cliente recuperar caso feche a aba
    try {
      const { error: orderUpdateErr } = await supabase
        .from('orders')
        .update({
          pix_code: pixData.qr_code,
          pix_qr_base64: pixData.qr_code_base64,
          pix_expires_at: paymentData.date_of_expiration,
        })
        .eq('id', order_id);
      if (orderUpdateErr) {
        console.error('[mercadopago-pix] Failed to persist PIX QR in order (non-blocking):', orderUpdateErr);
      }
    } catch (e) {
      console.error('[mercadopago-pix] PIX QR persist exception (non-blocking):', e);
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
      // MODELO BLINDADO - Platform receives only commission
      platform_fee: totalPlatformFee,
      platform_product_fee: platformProductFee,
      platform_service_fee: platformServiceFee,
      delivery_fee: actualDeliveryFee,
      establishment_receives: establishmentReceives,
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
