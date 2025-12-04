/**
 * Mercado Pago Subscriptions - Assinaturas SaaS
 * 
 * Gerencia assinaturas mensais dos lojistas usando a API de Preapproval.
 * 
 * Fluxo:
 * 1. Admin cria plano de assinatura (preapproval_plan)
 * 2. Lojista se inscreve no plano (preapproval)
 * 3. MP cobra automaticamente todo mês
 * 4. Webhook atualiza status no banco
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token da plataforma (não do vendedor)
const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

interface SubscriptionRequest {
  action: 'create_plan' | 'subscribe' | 'cancel' | 'get_status' | 'list_plans';
  plan_id?: string;
  establishment_id?: string;
  payer_email?: string;
  back_url?: string;
  // Para criar plano
  plan_data?: {
    reason: string;
    auto_recurring: {
      frequency: number;
      frequency_type: 'days' | 'months';
      transaction_amount: number;
      currency_id: string;
    };
  };
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

    if (!MP_ACCESS_TOKEN) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    const body: SubscriptionRequest = await req.json();
    const { action, plan_id, establishment_id, payer_email, back_url, plan_data } = body;

    console.log('Subscription request:', { action, plan_id, establishment_id });

    switch (action) {
      /**
       * Cria um plano de assinatura no Mercado Pago
       * Use /preapproval_plan para criar o template do plano
       */
      case 'create_plan': {
        if (!plan_data) {
          throw new Error('plan_data é obrigatório');
        }

        // Criar plano no MP usando API de Preapproval Plan
        const planResponse = await fetch('https://api.mercadopago.com/preapproval_plan', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: plan_data.reason,
            auto_recurring: {
              frequency: plan_data.auto_recurring.frequency,
              frequency_type: plan_data.auto_recurring.frequency_type,
              transaction_amount: plan_data.auto_recurring.transaction_amount,
              currency_id: plan_data.auto_recurring.currency_id || 'BRL',
            },
            back_url: back_url || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/painel`,
          }),
        });

        if (!planResponse.ok) {
          const error = await planResponse.json();
          console.error('MP Plan creation error:', error);
          throw new Error(error.message || 'Erro ao criar plano');
        }

        const mpPlan = await planResponse.json();
        console.log('Plan created:', mpPlan);

        /**
         * Resposta do MP:
         * - id: ID do plano no MP
         * - init_point: URL para assinar (não usado em preapproval_plan)
         * - application_id: ID da aplicação
         */

        // Salvar no banco vinculado ao plano interno
        if (plan_id) {
          await supabase.from('mp_subscription_plans').insert({
            plan_id,
            mp_preapproval_plan_id: mpPlan.id,
            reason: plan_data.reason,
            frequency: plan_data.auto_recurring.frequency,
            frequency_type: plan_data.auto_recurring.frequency_type,
            transaction_amount: plan_data.auto_recurring.transaction_amount,
            currency_id: plan_data.auto_recurring.currency_id || 'BRL',
          });
        }

        return new Response(JSON.stringify({
          success: true,
          mp_plan_id: mpPlan.id,
          message: 'Plano criado com sucesso',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      /**
       * Inscreve um lojista em um plano
       * Gera link de pagamento para primeira cobrança
       */
      case 'subscribe': {
        if (!plan_id || !establishment_id || !payer_email) {
          throw new Error('plan_id, establishment_id e payer_email são obrigatórios');
        }

        // Buscar plano no MP
        const { data: mpPlan } = await supabase
          .from('mp_subscription_plans')
          .select('*')
          .eq('plan_id', plan_id)
          .single();

        if (!mpPlan?.mp_preapproval_plan_id) {
          throw new Error('Plano não encontrado no Mercado Pago');
        }

        // Criar assinatura (preapproval)
        const subscriptionResponse = await fetch('https://api.mercadopago.com/preapproval', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preapproval_plan_id: mpPlan.mp_preapproval_plan_id,
            payer_email,
            external_reference: establishment_id, // Para identificar no webhook
            back_url: back_url || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/painel`,
            status: 'pending', // Aguardando primeiro pagamento
          }),
        });

        if (!subscriptionResponse.ok) {
          const error = await subscriptionResponse.json();
          console.error('MP Subscription error:', error);
          throw new Error(error.message || 'Erro ao criar assinatura');
        }

        const subscription = await subscriptionResponse.json();
        console.log('Subscription created:', subscription);

        /**
         * Resposta do MP:
         * - id: ID da assinatura
         * - init_point: URL para o cliente pagar
         * - status: pending, authorized, paused, cancelled
         */

        // Registrar transação
        await supabase.from('mp_transactions').insert({
          establishment_id,
          type: 'subscription',
          mp_preapproval_id: subscription.id,
          status: subscription.status,
          amount: mpPlan.transaction_amount,
          payer_email,
          metadata: { plan_id, mp_plan_id: mpPlan.mp_preapproval_plan_id },
        });

        // Atualizar assinatura do estabelecimento
        await supabase.from('subscriptions').insert({
          establishment_id,
          plan_id,
          status: 'pending',
          starts_at: new Date().toISOString(),
        });

        return new Response(JSON.stringify({
          success: true,
          subscription_id: subscription.id,
          init_point: subscription.init_point,
          status: subscription.status,
          message: 'Assinatura criada! Redirecione para o link de pagamento.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      /**
       * Cancela uma assinatura
       */
      case 'cancel': {
        if (!establishment_id) {
          throw new Error('establishment_id é obrigatório');
        }

        // Buscar assinatura ativa
        const { data: transaction } = await supabase
          .from('mp_transactions')
          .select('mp_preapproval_id')
          .eq('establishment_id', establishment_id)
          .eq('type', 'subscription')
          .eq('status', 'authorized')
          .single();

        if (!transaction?.mp_preapproval_id) {
          throw new Error('Nenhuma assinatura ativa encontrada');
        }

        // Cancelar no MP
        const cancelResponse = await fetch(
          `https://api.mercadopago.com/preapproval/${transaction.mp_preapproval_id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'cancelled' }),
          }
        );

        if (!cancelResponse.ok) {
          const error = await cancelResponse.json();
          throw new Error(error.message || 'Erro ao cancelar');
        }

        // Atualizar no banco
        await supabase
          .from('mp_transactions')
          .update({ status: 'cancelled' })
          .eq('mp_preapproval_id', transaction.mp_preapproval_id);

        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('establishment_id', establishment_id);

        return new Response(JSON.stringify({
          success: true,
          message: 'Assinatura cancelada com sucesso',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      /**
       * Consulta status de uma assinatura
       */
      case 'get_status': {
        if (!establishment_id) {
          throw new Error('establishment_id é obrigatório');
        }

        const { data: transaction } = await supabase
          .from('mp_transactions')
          .select('*')
          .eq('establishment_id', establishment_id)
          .eq('type', 'subscription')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!transaction?.mp_preapproval_id) {
          return new Response(JSON.stringify({
            success: true,
            status: 'none',
            message: 'Nenhuma assinatura encontrada',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Consultar status atual no MP
        const statusResponse = await fetch(
          `https://api.mercadopago.com/preapproval/${transaction.mp_preapproval_id}`,
          {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
          }
        );

        const mpStatus = await statusResponse.json();

        return new Response(JSON.stringify({
          success: true,
          status: mpStatus.status,
          next_payment_date: mpStatus.next_payment_date,
          last_modified: mpStatus.last_modified,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      /**
       * Lista todos os planos disponíveis
       */
      case 'list_plans': {
        const { data: plans } = await supabase
          .from('mp_subscription_plans')
          .select('*, plans(*)')
          .eq('is_active', true);

        return new Response(JSON.stringify({
          success: true,
          plans,
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
    console.error('Subscription error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * PAYLOADS DE EXEMPLO:
 * 
 * 1. Criar plano de assinatura:
 * POST /mercadopago-subscription
 * {
 *   "action": "create_plan",
 *   "plan_id": "uuid-do-plano-interno",
 *   "plan_data": {
 *     "reason": "Plano Pro VilaFood",
 *     "auto_recurring": {
 *       "frequency": 1,
 *       "frequency_type": "months",
 *       "transaction_amount": 99.90,
 *       "currency_id": "BRL"
 *     }
 *   }
 * }
 * 
 * 2. Inscrever lojista:
 * POST /mercadopago-subscription
 * {
 *   "action": "subscribe",
 *   "plan_id": "uuid-do-plano",
 *   "establishment_id": "uuid-do-estabelecimento",
 *   "payer_email": "lojista@email.com"
 * }
 * 
 * 3. Cancelar assinatura:
 * POST /mercadopago-subscription
 * {
 *   "action": "cancel",
 *   "establishment_id": "uuid-do-estabelecimento"
 * }
 */
