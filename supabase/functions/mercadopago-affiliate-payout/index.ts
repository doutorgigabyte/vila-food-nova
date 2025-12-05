/**
 * Mercado Pago Affiliate Payout - Pagamento de Comissões
 * 
 * Processa pagamentos de comissões para afiliados via PIX.
 * 
 * SECURITY: All actions require super_admin authentication
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

interface PayoutRequest {
  action: 'process_pending' | 'process_single' | 'check_balance' | 'list_pending';
  payout_id?: string;
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

    // SECURITY: Verify authentication for all actions
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Only super_admin can manage payouts
    const isSuperAdmin = await verifySuperAdmin(supabaseAdmin, user.id);
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem gerenciar pagamentos de afiliados', success: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PayoutRequest = await req.json();
    const { action, payout_id } = body;

    console.log('Payout request:', { action, payout_id, admin_user: user.id });

    switch (action) {
      case 'check_balance': {
        const balanceResponse = await fetch(
          'https://api.mercadopago.com/users/me',
          {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
          }
        );

        if (!balanceResponse.ok) {
          throw new Error('Erro ao consultar saldo');
        }

        const userData = await balanceResponse.json();
        
        const accountResponse = await fetch(
          'https://api.mercadopago.com/mercadopago_account/balance',
          {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
          }
        );

        let balance = 0;
        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          balance = accountData.available_balance || 0;
        }

        return new Response(JSON.stringify({
          success: true,
          user_id: userData.id,
          available_balance: balance,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_pending': {
        const { data: pendingPayouts, error } = await supabaseAdmin
          .from('affiliate_payouts')
          .select('*, affiliates(*, profiles(full_name))')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        if (error) throw error;

        const totalPending = pendingPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        return new Response(JSON.stringify({
          success: true,
          payouts: pendingPayouts,
          total_pending: totalPending,
          count: pendingPayouts?.length || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'process_single': {
        if (!payout_id) {
          throw new Error('payout_id é obrigatório');
        }

        const result = await processPayout(supabaseAdmin, payout_id, MP_ACCESS_TOKEN);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'process_pending': {
        const { data: pendingPayouts, error: fetchError } = await supabaseAdmin
          .from('affiliate_payouts')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(10);

        if (fetchError) throw fetchError;

        if (!pendingPayouts || pendingPayouts.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Nenhum payout pendente',
            processed: 0,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const results: Array<{ payout_id: string; success: boolean; error?: string }> = [];

        for (const payout of pendingPayouts) {
          try {
            const result = await processPayout(supabaseAdmin, payout.id, MP_ACCESS_TOKEN);
            results.push({
              payout_id: payout.id,
              success: result.success,
              error: result.error,
            });
          } catch (error) {
            results.push({
              payout_id: payout.id,
              success: false,
              error: error instanceof Error ? error.message : 'Erro desconhecido',
            });
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const successCount = results.filter(r => r.success).length;

        return new Response(JSON.stringify({
          success: true,
          processed: results.length,
          successful: successCount,
          failed: results.length - successCount,
          results,
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
    console.error('Payout error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processPayout(
  supabase: any,
  payoutId: string,
  accessToken: string
): Promise<{ success: boolean; mp_payment_id?: string; error?: string }> {
  
  const { data: payout, error: fetchError } = await supabase
    .from('affiliate_payouts')
    .select('*, affiliates(*)')
    .eq('id', payoutId)
    .single();

  if (fetchError || !payout) {
    return { success: false, error: 'Payout não encontrado' };
  }

  if (payout.status !== 'pending') {
    return { success: false, error: 'Payout já foi processado' };
  }

  await supabase
    .from('affiliate_payouts')
    .update({ status: 'processing' })
    .eq('id', payoutId);

  try {
    const affiliate = payout.affiliates as { 
      id: string; 
      user_id: string;
    };

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', affiliate.user_id)
      .single();

    const paymentPayload = {
      transaction_amount: Number(payout.amount),
      description: `Comissão de afiliado - VilaFood`,
      payment_method_id: 'pix',
      payer: {
        email: `afiliado_${affiliate.id}@vilafood.com`,
        first_name: profile?.full_name || 'Afiliado',
      },
      point_of_interaction: {
        type: 'PIX_TRANSFER',
        transaction_data: {
          pix_key: payout.pix_key,
        },
      },
      external_reference: `affiliate_payout_${payoutId}`,
    };

    console.log('Processing payout:', {
      payout_id: payoutId,
      amount: payout.amount,
      pix_key: payout.pix_key?.substring(0, 5) + '***',
    });

    const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `payout_${payoutId}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json();
      console.error('MP Payout error:', error);
      
      await supabase
        .from('affiliate_payouts')
        .update({ 
          status: 'failed',
          error_message: error.message || JSON.stringify(error),
        })
        .eq('id', payoutId);

      return { 
        success: false, 
        error: error.message || 'Erro ao processar pagamento' 
      };
    }

    const payment = await paymentResponse.json();
    console.log('Payout payment created:', {
      id: payment.id,
      status: payment.status,
    });

    await supabase
      .from('affiliate_payouts')
      .update({
        status: payment.status === 'approved' ? 'completed' : 'processing',
        mp_payment_id: payment.id.toString(),
        paid_at: payment.status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', payoutId);

    if (payment.status === 'approved') {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', affiliate.user_id)
          .single();

        if (profileData?.phone) {
          const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
          const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

          if (evolutionApiUrl && evolutionApiKey) {
            let formattedPhone = profileData.phone.replace(/\D/g, '');
            if (!formattedPhone.startsWith('55')) {
              formattedPhone = '55' + formattedPhone;
            }

            await fetch(`${evolutionApiUrl}/message/sendText/vilafood`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
              },
              body: JSON.stringify({
                number: formattedPhone,
                text: `🎉 *Comissão Paga!*\n\nOlá! Sua comissão de *R$ ${Number(payout.amount).toFixed(2)}* foi depositada via PIX.\n\nObrigado por fazer parte do VilaFood! 💚`,
              }),
            });

            console.log('WhatsApp notification sent to affiliate:', formattedPhone);
          }
        }
      } catch (notifError) {
        console.error('Failed to send WhatsApp notification:', notifError);
      }
    }

    return {
      success: true,
      mp_payment_id: payment.id.toString(),
    };

  } catch (error) {
    console.error('Payout processing error:', error);

    await supabase
      .from('affiliate_payouts')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
      })
      .eq('id', payoutId);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
