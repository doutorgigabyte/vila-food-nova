/**
 * Mercado Pago Subscriptions - Assinaturas SaaS
 * 
 * Gerencia assinaturas mensais dos lojistas usando a API de Preapproval.
 * 
 * SECURITY: create_plan requires super_admin role
 * SECURITY: subscribe, cancel, get_status require ownership verification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

interface SubscriptionRequest {
  action: 'create_plan' | 'subscribe' | 'cancel' | 'get_status' | 'list_plans';
  plan_id?: string;
  establishment_id?: string;
  payer_email?: string;
  back_url?: string;
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

// Helper to verify super_admin role
async function verifySuperAdmin(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single();
  return !!data;
}

// Helper to verify establishment ownership
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

  const isSuperAdmin = await verifySuperAdmin(supabaseAdmin, userId);
  if (isSuperAdmin) {
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

    if (!MP_ACCESS_TOKEN) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    const body: SubscriptionRequest = await req.json();
    const { action, plan_id, establishment_id, payer_email, back_url, plan_data } = body;

    console.log('Subscription request:', { action, plan_id, establishment_id });

    // Actions requiring authentication
    const actionsRequiringAuth = ['create_plan', 'subscribe', 'cancel', 'get_status'];
    
    let user = null;
    if (actionsRequiringAuth.includes(action)) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Autenticação necessária', success: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        return new Response(
          JSON.stringify({ error: 'Usuário não autenticado', success: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      user = authUser;
    }

    switch (action) {
      case 'create_plan': {
        // SECURITY: Only super_admin can create plans
        if (!user || !(await verifySuperAdmin(supabaseAdmin, user.id))) {
          return new Response(
            JSON.stringify({ error: 'Apenas administradores podem criar planos', success: false }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!plan_data) {
          throw new Error('plan_data é obrigatório');
        }

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

        if (plan_id) {
          await supabaseAdmin.from('mp_subscription_plans').insert({
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

      case 'subscribe': {
        if (!plan_id || !establishment_id || !payer_email) {
          throw new Error('plan_id, establishment_id e payer_email são obrigatórios');
        }

        // SECURITY: Verify ownership
        const ownershipCheck = await verifyEstablishmentOwnership(supabaseAdmin, user!.id, establishment_id);
        if (!ownershipCheck.authorized) {
          return new Response(
            JSON.stringify({ error: ownershipCheck.error, success: false }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: mpPlan } = await supabaseAdmin
          .from('mp_subscription_plans')
          .select('*')
          .eq('plan_id', plan_id)
          .single();

        if (!mpPlan?.mp_preapproval_plan_id) {
          throw new Error('Plano não encontrado no Mercado Pago');
        }

        const subscriptionResponse = await fetch('https://api.mercadopago.com/preapproval', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preapproval_plan_id: mpPlan.mp_preapproval_plan_id,
            payer_email,
            external_reference: establishment_id,
            back_url: back_url || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/painel`,
            status: 'pending',
          }),
        });

        if (!subscriptionResponse.ok) {
          const error = await subscriptionResponse.json();
          console.error('MP Subscription error:', error);
          throw new Error(error.message || 'Erro ao criar assinatura');
        }

        const subscription = await subscriptionResponse.json();
        console.log('Subscription created:', subscription);

        await supabaseAdmin.from('mp_transactions').insert({
          establishment_id,
          type: 'subscription',
          mp_preapproval_id: subscription.id,
          status: subscription.status,
          amount: mpPlan.transaction_amount,
          payer_email,
          metadata: { plan_id, mp_plan_id: mpPlan.mp_preapproval_plan_id },
        });

        await supabaseAdmin.from('subscriptions').insert({
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

      case 'cancel': {
        if (!establishment_id) {
          throw new Error('establishment_id é obrigatório');
        }

        // SECURITY: Verify ownership
        const ownershipCheck = await verifyEstablishmentOwnership(supabaseAdmin, user!.id, establishment_id);
        if (!ownershipCheck.authorized) {
          return new Response(
            JSON.stringify({ error: ownershipCheck.error, success: false }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: transaction } = await supabaseAdmin
          .from('mp_transactions')
          .select('mp_preapproval_id')
          .eq('establishment_id', establishment_id)
          .eq('type', 'subscription')
          .eq('status', 'authorized')
          .single();

        if (!transaction?.mp_preapproval_id) {
          throw new Error('Nenhuma assinatura ativa encontrada');
        }

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

        await supabaseAdmin
          .from('mp_transactions')
          .update({ status: 'cancelled' })
          .eq('mp_preapproval_id', transaction.mp_preapproval_id);

        await supabaseAdmin
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

      case 'get_status': {
        if (!establishment_id) {
          throw new Error('establishment_id é obrigatório');
        }

        // SECURITY: Verify ownership
        const ownershipCheck = await verifyEstablishmentOwnership(supabaseAdmin, user!.id, establishment_id);
        if (!ownershipCheck.authorized) {
          return new Response(
            JSON.stringify({ error: ownershipCheck.error, success: false }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: transaction } = await supabaseAdmin
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

      case 'list_plans': {
        const { data: plans } = await supabaseAdmin
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
