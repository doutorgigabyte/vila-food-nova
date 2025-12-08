/**
 * Mercado Pago PIX - Geração de QR Code PIX
 * 
 * Gera QR codes PIX dinâmicos para pagamento de pedidos.
 * Suporta fallback para PIX estático se não houver token MP configurado.
 * 
 * SECURITY: Requires valid order_id to generate PIX codes
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PixRequest {
  establishment_id: string;
  order_id: string; // Now required for security
  amount: number;
  description: string;
  payer_email?: string;
  payer_name?: string;
  external_reference?: string;
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
    const { establishment_id, order_id, amount, description, payer_email, payer_name, external_reference } = body;

    // Validate required fields
    if (!establishment_id) {
      return new Response(JSON.stringify({ error: 'establishment_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Require order_id to prevent abuse
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

    console.log('PIX request:', { establishment_id, order_id, amount });

    // SECURITY: Validate that the order exists and belongs to the establishment
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

    // Validate order is in a valid state for payment
    if (order.status === 'cancelled' || order.status === 'delivered') {
      return new Response(JSON.stringify({ error: 'Pedido não pode receber pagamento neste status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get establishment's Mercado Pago token (excluding sensitive columns from log)
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('mercado_pago_token, name, pix_key')
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment) {
      return new Response(JSON.stringify({ error: 'Estabelecimento não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if establishment has Mercado Pago configured
    if (!establishment.mercado_pago_token) {
      // If no MP token, check for PIX key and return static PIX
      if (establishment.pix_key) {
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
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Pagamento PIX não configurado',
        message: 'Este estabelecimento ainda não configurou o pagamento via PIX. Por favor, escolha outra forma de pagamento.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create PIX payment via Mercado Pago
    const mpPayload = {
      transaction_amount: amount,
      description: description || `Pedido ${establishment.name}`,
      payment_method_id: 'pix',
      payer: {
        email: payer_email || 'cliente@email.com',
        first_name: payer_name || 'Cliente',
      },
      external_reference: external_reference || order_id,
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${establishment.mercado_pago_token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${establishment_id}-${order_id}`,
      },
      body: JSON.stringify(mpPayload),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      console.error('Mercado Pago error:', errorData);
      
      // Fallback to static PIX if available
      if (establishment.pix_key) {
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
      }

      throw new Error(errorData.message || 'Erro ao criar pagamento PIX');
    }

    const paymentData = await mpResponse.json();
    console.log('Mercado Pago payment created:', { id: paymentData.id, status: paymentData.status });

    const pixData = paymentData.point_of_interaction?.transaction_data;

    // Validate PIX data exists
    if (!pixData) {
      console.error('PIX data not found in payment response:', paymentData);
      
      // Fallback to static PIX if available
      if (establishment.pix_key) {
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
      }

      throw new Error('Dados PIX não encontrados na resposta do Mercado Pago');
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
        },
      });
    } catch (analyticsError) {
      console.error('Error logging analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }

    const qrCodeBase64 = pixData?.qr_code_base64;
    const qrCode = pixData?.qr_code;

    if (!qrCode) {
      console.error('QR Code not found in PIX data:', pixData);
      
      // Fallback to static PIX if available
      if (establishment.pix_key) {
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
      }

      throw new Error('QR Code PIX não encontrado na resposta');
    }

    return new Response(JSON.stringify({
      success: true,
      type: 'dynamic_pix',
      payment_id: paymentData.id,
      status: paymentData.status,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      qr_code_url: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
      amount,
      order_id,
      expiration: paymentData.date_of_expiration,
      message: `💰 *Pagamento via PIX*\n\nValor: R$ ${amount.toFixed(2)}\n\n📱 Escaneie o QR Code ou copie o código abaixo:\n\n\`\`\`${qrCode}\`\`\`\n\n⏰ Válido por 30 minutos\n\nO pedido será confirmado automaticamente após o pagamento!`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PIX error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: '❌ Erro ao gerar PIX. Por favor, tente novamente ou escolha outra forma de pagamento.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
