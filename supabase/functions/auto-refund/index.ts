/**
 * Auto Refund - Reembolso Automático Parcial
 * 
 * Processa reembolsos automáticos para:
 * - Pedidos Vila com pagamentos incompletos (timeout 10 min)
 * - Pagamentos PIX não utilizados
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

interface RefundRequest {
  payment_id: string;
  amount?: number; // Partial refund amount, omit for full refund
  reason?: string;
  establishment_id?: string;
}

async function processRefund(paymentId: string, amount?: number): Promise<{ success: boolean; refund_id?: string; error?: string }> {
  try {
    const refundUrl = `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`;
    
    const body: Record<string, unknown> = {};
    if (amount) {
      body.amount = amount;
    }

    const response = await fetch(refundUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Refund API error:', data);
      return {
        success: false,
        error: data.message || `Refund failed with status ${response.status}`,
      };
    }

    console.log('Refund successful:', data);
    return {
      success: true,
      refund_id: data.id?.toString(),
    };
  } catch (error) {
    console.error('Refund error:', error);
    return {
      success: false,
      error: error.message || 'Unknown refund error',
    };
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

    const { action, ...params } = await req.json();

    switch (action) {
      case 'refund_payment': {
        const { payment_id, amount, reason, establishment_id } = params as RefundRequest;
        
        if (!payment_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'payment_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const result = await processRefund(payment_id, amount);

        // Log refund attempt
        await supabase.from('audit_logs').insert({
          entity_type: 'payment_refund',
          entity_id: payment_id,
          action: amount ? 'partial_refund' : 'full_refund',
          metadata: {
            amount,
            reason,
            establishment_id,
            refund_result: result,
          },
        });

        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_expired_vila_payments': {
        // Find Vila orders with partial payments older than 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        
        const { data: expiredTransactions } = await supabase
          .from('mp_transactions')
          .select('*')
          .eq('status', 'approved')
          .eq('metadata->is_vila_order', true)
          .eq('metadata->all_stores_paid', false)
          .lt('created_at', tenMinutesAgo);

        if (!expiredTransactions || expiredTransactions.length === 0) {
          return new Response(
            JSON.stringify({ success: true, refunded: 0, message: 'No expired Vila payments found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const refundResults = [];
        for (const tx of expiredTransactions) {
          const result = await processRefund(tx.gateway_payment_id);
          
          if (result.success) {
            // Update transaction status
            await supabase
              .from('mp_transactions')
              .update({ status: 'refunded' })
              .eq('id', tx.id);
          }
          
          refundResults.push({ transaction_id: tx.id, ...result });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            refunded: refundResults.filter(r => r.success).length,
            results: refundResults 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Auto refund error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
