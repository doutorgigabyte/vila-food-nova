/**
 * Mercado Pago Sale - Vendas com Split de Pagamento
 * 
 * Processa vendas do marketplace onde:
 * - Cliente paga o valor total
 * - Plataforma retém taxa (application_fee)
 * - Restante vai para conta MP do lojista (split)
 * 
 * SECURITY: Requires authentication and ownership verification for sensitive operations
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
const PLATFORM_FEE_PERCENT = parseFloat(Deno.env.get('MERCADOPAGO_PLATFORM_FEE') || '5');

interface SaleRequest {
  action: 'create_payment' | 'get_payment' | 'refund';
  order_id?: string;
  establishment_id: string;
  payment_id?: string;
  payment_data?: {
    transaction_amount: number;
    description: string;
    payment_method_id: string;
    payer: {
      email: string;
      first_name?: string;
      last_name?: string;
      identification?: {
        type: string;
        number: string;
      };
    };
    token?: string;
    installments?: number;
    issuer_id?: string;
  };
}

// Helper function to verify establishment ownership
async function verifyEstablishmentOwnership(
  supabaseAdmin: any,
  userId: string,
  establishmentId: string
): Promise<{ authorized: boolean; error?: string }> {
  const { data: establishment, error } = await supabaseAdmin
    .from('establishments')
    .select('owner_id')
    .eq('id', establishmentId)
    .single();

  if (error || !establishment) {
    return { authorized: false, error: 'Estabelecimento não encontrado' };
  }

  if (establishment.owner_id === userId) {
    return { authorized: true };
  }

  // Check if user is super_admin
  const { data: userRole } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single();

  if (userRole) {
    return { authorized: true };
  }

  return { authorized: false, error: 'Você não tem permissão para gerenciar este estabelecimento' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: SaleRequest = await req.json();
    const { action, order_id, establishment_id, payment_id, payment_data } = body;

    console.log('Sale request:', { action, order_id, establishment_id });

    // For refund action, require authentication and ownership verification
    if (action === 'refund') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Autenticação necessária para estorno', success: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Usuário não autenticado', success: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const ownershipCheck = await verifyEstablishmentOwnership(supabaseAdmin, user.id, establishment_id);
      if (!ownershipCheck.authorized) {
        return new Response(
          JSON.stringify({ error: ownershipCheck.error, success: false }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch establishment data
    const { data: establishment, error: estError } = await supabaseAdmin
      .from('establishments')
      .select('mp_user_id, name')
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment) {
      throw new Error('Estabelecimento não encontrado');
    }

    switch (action) {
      case 'create_payment': {
        if (!payment_data) {
          throw new Error('payment_data é obrigatório');
        }

        if (!MP_ACCESS_TOKEN) {
          throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
        }

        if (!establishment.mp_user_id) {
          throw new Error('Estabelecimento não conectou conta Mercado Pago');
        }

        const { transaction_amount, description, payment_method_id, payer, token, installments, issuer_id } = payment_data;

        const platformFee = Math.round((transaction_amount * PLATFORM_FEE_PERCENT / 100) * 100) / 100;
        const netAmount = transaction_amount - platformFee;

        const paymentPayload: Record<string, unknown> = {
          transaction_amount,
          description,
          payment_method_id,
          payer: {
            email: payer.email,
            first_name: payer.first_name,
            last_name: payer.last_name,
            identification: payer.identification,
          },
          external_reference: order_id || `order_${Date.now()}`,
          application_fee: platformFee,
          collector_id: parseInt(establishment.mp_user_id),
          notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
        };

        if (payment_method_id !== 'pix' && token) {
          paymentPayload.token = token;
          paymentPayload.installments = installments || 1;
          if (issuer_id) paymentPayload.issuer_id = issuer_id;
        }

        console.log('Creating payment:', { 
          amount: transaction_amount, 
          fee: platformFee, 
          net: netAmount,
          collector: establishment.mp_user_id 
        });

        const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `${establishment_id}-${order_id || Date.now()}`,
          },
          body: JSON.stringify(paymentPayload),
        });

        if (!paymentResponse.ok) {
          const error = await paymentResponse.json();
          console.error('MP Payment error:', error);
          throw new Error(error.message || 'Erro ao criar pagamento');
        }

        const payment = await paymentResponse.json();
        console.log('Payment created:', {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
        });

        await supabaseAdmin.from('mp_transactions').insert({
          establishment_id,
          type: 'sale',
          mp_payment_id: payment.id.toString(),
          status: payment.status,
          amount: transaction_amount,
          platform_fee: platformFee,
          net_amount: netAmount,
          payer_email: payer.email,
          payer_name: `${payer.first_name || ''} ${payer.last_name || ''}`.trim(),
          metadata: { 
            order_id, 
            payment_method: payment_method_id,
            status_detail: payment.status_detail,
          },
        });

        if (order_id) {
          const orderStatus = payment.status === 'approved' ? 'confirmed' : 
                            payment.status === 'pending' ? 'pending' : 'cancelled';
          
          await supabaseAdmin
            .from('orders')
            .update({ 
              status: orderStatus,
              payment_method: payment_method_id === 'pix' ? 'pix' : 'card',
            })
            .eq('id', order_id);
        }

        const response: Record<string, unknown> = {
          success: true,
          payment_id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          platform_fee: platformFee,
          net_amount: netAmount,
        };

        if (payment_method_id === 'pix' && payment.point_of_interaction?.transaction_data) {
          const pixData = payment.point_of_interaction.transaction_data;
          response.pix = {
            qr_code: pixData.qr_code,
            qr_code_base64: pixData.qr_code_base64,
            expiration_date: payment.date_of_expiration,
          };
        }

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_payment': {
        if (!payment_id) {
          throw new Error('payment_id é obrigatório');
        }

        const statusResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${payment_id}`,
          {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
          }
        );

        if (!statusResponse.ok) {
          throw new Error('Pagamento não encontrado');
        }

        const payment = await statusResponse.json();

        return new Response(JSON.stringify({
          success: true,
          payment_id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          amount: payment.transaction_amount,
          date_approved: payment.date_approved,
          payment_method: payment.payment_method_id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'refund': {
        if (!payment_id) {
          throw new Error('payment_id é obrigatório');
        }

        const refundResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${payment_id}/refunds`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!refundResponse.ok) {
          const error = await refundResponse.json();
          throw new Error(error.message || 'Erro ao estornar');
        }

        const refund = await refundResponse.json();

        await supabaseAdmin.from('mp_transactions').insert({
          establishment_id,
          type: 'refund',
          mp_payment_id: payment_id,
          status: 'refunded',
          amount: -refund.amount,
          metadata: { original_payment_id: payment_id, refund_id: refund.id },
        });

        return new Response(JSON.stringify({
          success: true,
          refund_id: refund.id,
          amount: refund.amount,
          message: 'Pagamento estornado com sucesso',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Sale error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
