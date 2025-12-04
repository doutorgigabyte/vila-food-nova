/**
 * Mercado Pago Affiliate Payout - Pagamento de Comissões
 * 
 * Processa pagamentos de comissões para afiliados via PIX.
 * 
 * Fluxo:
 * 1. Cron job busca payouts pendentes
 * 2. Verifica saldo disponível na conta da plataforma
 * 3. Envia pagamento PIX para chave do afiliado
 * 4. Atualiza status do payout
 * 
 * Usa a API de Pagamentos do MP para enviar dinheiro
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token da plataforma (tem saldo para pagar afiliados)
const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

interface PayoutRequest {
  action: 'process_pending' | 'process_single' | 'check_balance' | 'list_pending';
  payout_id?: string;
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

    const body: PayoutRequest = await req.json();
    const { action, payout_id } = body;

    console.log('Payout request:', { action, payout_id });

    switch (action) {
      /**
       * Verifica saldo disponível na conta da plataforma
       * Importante verificar antes de tentar pagar
       */
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
        
        // Buscar saldo disponível
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

      /**
       * Lista pagamentos pendentes
       */
      case 'list_pending': {
        const { data: pendingPayouts, error } = await supabase
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

      /**
       * Processa um único payout
       */
      case 'process_single': {
        if (!payout_id) {
          throw new Error('payout_id é obrigatório');
        }

        const result = await processPayout(supabase, payout_id, MP_ACCESS_TOKEN);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      /**
       * Processa todos os payouts pendentes (cron job)
       * Deve ser chamado periodicamente (ex: diariamente)
       */
      case 'process_pending': {
        // Buscar payouts pendentes
        const { data: pendingPayouts, error: fetchError } = await supabase
          .from('affiliate_payouts')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(10); // Processar em batches para evitar timeout

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

        // Processar cada payout
        for (const payout of pendingPayouts) {
          try {
            const result = await processPayout(supabase, payout.id, MP_ACCESS_TOKEN);
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

          // Pequeno delay entre pagamentos para evitar rate limit
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

/**
 * Processa um payout individual via PIX
 * 
 * Usa a API de Pagamentos do MP com payment_method_id = 'pix'
 * O dinheiro sai da conta da plataforma e vai para a chave PIX do afiliado
 */
async function processPayout(
  supabase: any,
  payoutId: string,
  accessToken: string
): Promise<{ success: boolean; mp_payment_id?: string; error?: string }> {
  
  // Buscar detalhes do payout
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

  // Marcar como processando
  await supabase
    .from('affiliate_payouts')
    .update({ status: 'processing' })
    .eq('id', payoutId);

  try {
    const affiliate = payout.affiliates as { 
      id: string; 
      user_id: string;
    };

    // Buscar email do afiliado
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', affiliate.user_id)
      .single();

    /**
     * Criar pagamento PIX
     * 
     * Nota: Para enviar dinheiro via PIX, usamos a API de Pagamentos
     * com payment_method_id = 'pix' e os dados do recebedor
     * 
     * Em produção, você pode precisar usar a API de Disbursements
     * ou a API de Withdrawal dependendo do seu modelo de negócio
     */
    const paymentPayload = {
      transaction_amount: Number(payout.amount),
      description: `Comissão de afiliado - VilaFood`,
      payment_method_id: 'pix',
      payer: {
        email: `afiliado_${affiliate.id}@vilafood.com`, // Email interno para tracking
        first_name: profile?.full_name || 'Afiliado',
      },
      // Dados do recebedor PIX
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

    // Criar pagamento
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
      
      // Marcar como falhou
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

    // Atualizar payout com sucesso
    await supabase
      .from('affiliate_payouts')
      .update({
        status: payment.status === 'approved' ? 'completed' : 'processing',
        mp_payment_id: payment.id.toString(),
        paid_at: payment.status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', payoutId);

    return {
      success: true,
      mp_payment_id: payment.id.toString(),
    };

  } catch (error) {
    console.error('Payout processing error:', error);

    // Reverter para pendente em caso de erro
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

/**
 * PAYLOADS DE EXEMPLO:
 * 
 * 1. Verificar saldo:
 * POST /mercadopago-affiliate-payout
 * {
 *   "action": "check_balance"
 * }
 * 
 * 2. Listar pendentes:
 * POST /mercadopago-affiliate-payout
 * {
 *   "action": "list_pending"
 * }
 * 
 * 3. Processar um payout:
 * POST /mercadopago-affiliate-payout
 * {
 *   "action": "process_single",
 *   "payout_id": "uuid-do-payout"
 * }
 * 
 * 4. Processar todos pendentes (cron):
 * POST /mercadopago-affiliate-payout
 * {
 *   "action": "process_pending"
 * }
 * 
 * 
 * CONFIGURAÇÃO DO CRON JOB (executar diariamente):
 * 
 * SELECT cron.schedule(
 *   'process-affiliate-payouts',
 *   '0 10 * * *', -- Todo dia às 10h
 *   $$
 *   SELECT net.http_post(
 *     url:='https://gyagfsjbdaacgmmofqip.supabase.co/functions/v1/mercadopago-affiliate-payout',
 *     headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbG..."}'::jsonb,
 *     body:='{"action": "process_pending"}'::jsonb
 *   ) AS request_id;
 *   $$
 * );
 */
