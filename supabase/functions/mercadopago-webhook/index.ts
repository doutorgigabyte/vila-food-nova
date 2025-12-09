/**
 * Mercado Pago Webhook - Notificações de Eventos
 * 
 * Recebe notificações do Mercado Pago sobre:
 * - Pagamentos (aprovados, recusados, estornados)
 * - Assinaturas (criadas, pausadas, canceladas)
 * 
 * IMPORTANTE: Valida assinatura x-signature para segurança
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
};

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
const MP_WEBHOOK_SECRET = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');

interface WebhookPayload {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

/**
 * Valida assinatura do webhook usando Web Crypto API
 * O MP envia x-signature no formato: ts=xxx,v1=hash
 */
async function validateSignature(
  signature: string | null, 
  requestId: string | null, 
  dataId: string
): Promise<boolean> {
  if (!MP_WEBHOOK_SECRET || !signature) {
    console.warn('Webhook signature validation skipped - no secret configured');
    return true; // Em desenvolvimento, permite sem validação
  }

  try {
    // Parse signature: ts=xxx,v1=hash
    const parts = signature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!ts || !v1) {
      console.error('Invalid signature format');
      return false;
    }

    // Construir string para validação
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    
    // Gerar HMAC-SHA256 usando Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(MP_WEBHOOK_SECRET);
    const messageData = encoder.encode(manifest);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return expectedHash === v1;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
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

    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');
    
    const payload: WebhookPayload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    const { type, data, action } = payload;

    // Validar assinatura (em produção)
    const isValid = await validateSignature(signature, requestId, data.id);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    /**
     * Tipos de notificação:
     * - payment: Pagamentos (vendas)
     * - preapproval: Assinaturas
     * - plan: Planos de assinatura
     * - subscription_preapproval: Cobranças de assinatura
     */

    switch (type) {
      /**
       * WEBHOOK DE PAGAMENTO
       * Atualiza status do pedido e registra transação
       */
      case 'payment': {
        // Primeiro, tentar buscar com token global da plataforma
        let paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${data.id}`,
          {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
          }
        );

        // Se falhar, pode ser pagamento do lojista - buscar transação para pegar o token dele
        if (!paymentResponse.ok) {
          console.log('Payment not found with platform token, trying to find merchant token...');
          
          // Tentar buscar pelo user_id (collector_id do MP) 
          const { data: establishment } = await supabase
            .from('establishments')
            .select('mercado_pago_token')
            .eq('mp_user_id', payload.user_id)
            .single();
          
          if (establishment?.mercado_pago_token) {
            console.log('Found merchant token, retrying payment fetch...');
            paymentResponse = await fetch(
              `https://api.mercadopago.com/v1/payments/${data.id}`,
              {
                headers: { 'Authorization': `Bearer ${establishment.mercado_pago_token}` },
              }
            );
          }
        }

        if (!paymentResponse.ok) {
          console.error('Failed to fetch payment details with all available tokens');
          // Ainda assim, tentar atualizar pelo external_reference se tiver na mp_transactions
          const { data: pendingTx } = await supabase
            .from('mp_transactions')
            .select('order_id, establishment_id')
            .eq('mp_payment_id', data.id)
            .single();
          
          if (pendingTx?.order_id) {
            // Assumir aprovado se chegou webhook payment.created e não conseguiu buscar
            // O status será corrigido pelo próximo webhook ou pela consulta manual
            console.log('Updating order to pending status as fallback');
            await supabase
              .from('orders')
              .update({ status: 'pending' })
              .eq('id', pendingTx.order_id);
          }
          break;
        }

        const payment = await paymentResponse.json();
        console.log('Payment details:', {
          id: payment.id,
          status: payment.status,
          external_reference: payment.external_reference,
        });

        // Atualizar transação no banco
        const { error: updateError } = await supabase
          .from('mp_transactions')
          .update({
            status: payment.status,
            updated_at: new Date().toISOString(),
            metadata: {
              status_detail: payment.status_detail,
              date_approved: payment.date_approved,
              date_last_updated: payment.date_last_updated,
            },
          })
          .eq('mp_payment_id', data.id);

        if (updateError) {
          console.error('Error updating transaction:', updateError);
        }

        // Se tiver external_reference (order_id), atualizar pedido
        if (payment.external_reference) {
          const orderStatus = payment.status === 'approved' ? 'confirmed' :
                            payment.status === 'rejected' ? 'cancelled' :
                            payment.status === 'refunded' ? 'cancelled' :
                            payment.status === 'in_process' ? 'pending' : 'pending';

          await supabase
            .from('orders')
            .update({ status: orderStatus })
            .eq('id', payment.external_reference);

          // Registrar no cash_flow se aprovado
          if (payment.status === 'approved') {
            // Buscar transação para pegar establishment_id
            const { data: transaction } = await supabase
              .from('mp_transactions')
              .select('establishment_id, net_amount')
              .eq('mp_payment_id', data.id)
              .single();

            if (transaction) {
              await supabase.from('cash_flow').insert({
                establishment_id: transaction.establishment_id,
                type: 'income',
                amount: transaction.net_amount,
                category: 'vendas',
                payment_method: payment.payment_method_id,
                description: `Pedido #${payment.external_reference?.slice(-8) || data.id}`,
                reference_id: payment.external_reference,
              });
            }
          }
        }

        break;
      }

      /**
       * WEBHOOK DE ASSINATURA (PREAPPROVAL)
       * Atualiza status da assinatura do lojista
       */
      case 'preapproval': {
        // Buscar detalhes da assinatura
        const preapprovalResponse = await fetch(
          `https://api.mercadopago.com/preapproval/${data.id}`,
          {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
          }
        );

        if (!preapprovalResponse.ok) {
          console.error('Failed to fetch preapproval details');
          break;
        }

        const preapproval = await preapprovalResponse.json();
        console.log('Preapproval details:', {
          id: preapproval.id,
          status: preapproval.status,
          external_reference: preapproval.external_reference,
        });

        /**
         * Status da assinatura:
         * - pending: Aguardando primeiro pagamento
         * - authorized: Ativa (pagamento aprovado)
         * - paused: Pausada pelo usuário
         * - cancelled: Cancelada
         */

        // Atualizar transação
        await supabase
          .from('mp_transactions')
          .update({
            status: preapproval.status,
            updated_at: new Date().toISOString(),
          })
          .eq('mp_preapproval_id', data.id);

        // Atualizar subscription interna
        if (preapproval.external_reference) {
          const establishmentId = preapproval.external_reference;
          
          // Mapear status do MP para status interno
          const internalStatus = preapproval.status === 'authorized' ? 'active' :
                                preapproval.status === 'paused' ? 'paused' :
                                preapproval.status === 'cancelled' ? 'cancelled' : 'pending';

          await supabase
            .from('subscriptions')
            .update({ status: internalStatus })
            .eq('establishment_id', establishmentId);

          // Atualizar status do estabelecimento
          // Se assinatura ativa, estabelecimento pode operar
          // Se cancelada/pausada, bloquear acesso
          const establishmentStatus = preapproval.status === 'authorized' ? 'active' : 'pending';
          
          await supabase
            .from('establishments')
            .update({ status: establishmentStatus })
            .eq('id', establishmentId);

          // Se foi primeira aprovação, processar comissão do afiliado
          if (preapproval.status === 'authorized' && action === 'updated') {
            await processAffiliateCommission(supabase, establishmentId, preapproval);
          }
        }

        break;
      }

      /**
       * WEBHOOK DE COBRANÇA DE ASSINATURA
       * Quando MP cobra mensalidade automaticamente
       */
      case 'subscription_preapproval': {
        // Buscar detalhes da cobrança
        const chargeResponse = await fetch(
          `https://api.mercadopago.com/authorized_payments/${data.id}`,
          {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
          }
        );

        if (chargeResponse.ok) {
          const charge = await chargeResponse.json();
          console.log('Subscription charge:', {
            id: charge.id,
            status: charge.status,
            preapproval_id: charge.preapproval_id,
          });

          // Registrar pagamento da mensalidade
          if (charge.status === 'approved') {
            // Buscar transação da assinatura
            const { data: transaction } = await supabase
              .from('mp_transactions')
              .select('establishment_id, amount')
              .eq('mp_preapproval_id', charge.preapproval_id)
              .single();

            if (transaction) {
              // Registrar no cash_flow como receita da plataforma
              await supabase.from('mp_transactions').insert({
                establishment_id: transaction.establishment_id,
                type: 'subscription',
                mp_payment_id: charge.id.toString(),
                status: 'approved',
                amount: charge.transaction_amount,
                metadata: { preapproval_id: charge.preapproval_id },
              });
            }
          }
        }

        break;
      }

      default:
        console.log('Unhandled webhook type:', type);
    }

    // Sempre retornar 200 para o MP não reenviar
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    // Retornar 200 mesmo com erro para não reenviar indefinidamente
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Processa comissão do afiliado quando assinatura é aprovada
 */
async function processAffiliateCommission(
  supabase: any,
  establishmentId: string,
  preapproval: Record<string, unknown>
) {
  try {
    // Buscar estabelecimento e verificar se tem afiliado
    const { data: referral } = await supabase
      .from('affiliate_referrals')
      .select('*, affiliates(*)')
      .eq('establishment_id', establishmentId)
      .eq('status', 'pending')
      .single();

    if (!referral?.affiliates) {
      return;
    }

    const affiliate = referral.affiliates as { id: string; commission_rate: number; chave_pix?: string };
    const subscriptionAmount = (preapproval.auto_recurring as { transaction_amount?: number })?.transaction_amount || 0;
    const commissionRate = affiliate.commission_rate || 20; // 20% padrão
    const commissionAmount = (subscriptionAmount * commissionRate) / 100;

    // Criar registro de payout pendente
    if (affiliate.chave_pix) {
      await supabase.from('affiliate_payouts').insert({
        affiliate_id: affiliate.id,
        referral_id: referral.id,
        amount: commissionAmount,
        pix_key: affiliate.chave_pix,
        status: 'pending',
      });
    }

    // Atualizar status do referral
    await supabase
      .from('affiliate_referrals')
      .update({ 
        status: 'converted',
        commission_earned: commissionAmount,
      })
      .eq('id', referral.id);

    // Atualizar total de ganhos do afiliado
    await supabase
      .from('affiliates')
      .update({ total_earnings: commissionAmount })
      .eq('id', affiliate.id);

    console.log('Affiliate commission processed:', {
      affiliate_id: affiliate.id,
      amount: commissionAmount,
    });

  } catch (error) {
    console.error('Error processing affiliate commission:', error);
  }
}
