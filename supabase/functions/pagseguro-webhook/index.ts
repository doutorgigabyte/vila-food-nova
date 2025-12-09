/**
 * PagBank/PagSeguro Webhook - Confirmação de Pagamentos
 * 
 * Recebe notificações do PagBank sobre mudanças de status de pagamentos.
 * Atualiza o status do pedido e transação no banco de dados.
 * 
 * Documentação: https://dev.pagbank.uol.com.br/reference/webhooks
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PagBankWebhookEvent {
  id: string;
  reference_id: string;
  created_at: string;
  charges?: Array<{
    id: string;
    reference_id: string;
    status: string;
    amount: {
      value: number;
      currency: string;
    };
    payment_method?: {
      type: string;
    };
    paid_at?: string;
  }>;
}

// Map PagBank status to internal status
function mapPagBankStatus(pagbankStatus: string): string {
  const statusMap: Record<string, string> = {
    'AUTHORIZED': 'pending',
    'PAID': 'approved',
    'IN_ANALYSIS': 'in_process',
    'DECLINED': 'rejected',
    'CANCELED': 'cancelled',
    'WAITING': 'pending',
  };
  return statusMap[pagbankStatus] || 'pending';
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

    const body = await req.json();
    console.log('PagBank webhook received:', JSON.stringify(body, null, 2));

    // PagBank pode enviar o evento diretamente ou dentro de um wrapper
    const event: PagBankWebhookEvent = body.order || body;
    
    if (!event.id && !event.reference_id) {
      console.log('Invalid webhook payload, missing id or reference_id');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orderId = event.reference_id;
    const charges = event.charges || [];

    for (const charge of charges) {
      const chargeStatus = charge.status;
      const internalStatus = mapPagBankStatus(chargeStatus);
      
      console.log('Processing charge:', { 
        charge_id: charge.id, 
        order_id: orderId, 
        pagbank_status: chargeStatus,
        internal_status: internalStatus 
      });

      // Update transaction status
      const { error: txError } = await supabase
        .from('mp_transactions')
        .update({
          status: internalStatus,
          updated_at: new Date().toISOString(),
          metadata: {
            pagbank_status: chargeStatus,
            paid_at: charge.paid_at,
            charge_id: charge.id,
          }
        })
        .eq('order_id', orderId)
        .eq('gateway', 'pagseguro');

      if (txError) {
        console.error('Error updating transaction:', txError);
      }

      // If payment is approved, update order status
      if (internalStatus === 'approved') {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, establishment_id, status')
          .eq('id', orderId)
          .single();

        if (!orderError && order && order.status === 'pending') {
          await supabase
            .from('orders')
            .update({ 
              status: 'confirmed',
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          console.log('Order confirmed:', orderId);

          // Notify establishment via WhatsApp if configured
          try {
            const { data: establishment } = await supabase
              .from('establishments')
              .select('whatsapp_instance_name, whatsapp')
              .eq('id', order.establishment_id)
              .single();

            if (establishment?.whatsapp_instance_name && establishment?.whatsapp) {
              await supabase.functions.invoke('whatsapp-notification', {
                body: {
                  instance_name: establishment.whatsapp_instance_name,
                  phone: establishment.whatsapp,
                  message: `✅ *Pagamento Confirmado!*\n\n💰 Pedido #${orderId.substring(0, 8)}\n💳 PagBank PIX\n💵 R$ ${(charge.amount.value / 100).toFixed(2)}\n\n📦 O pedido está pronto para preparo!`,
                }
              });
            }
          } catch (notifyError) {
            console.error('Error sending notification:', notifyError);
          }
        }
      }

      // Handle declined/cancelled payments
      if (internalStatus === 'rejected' || internalStatus === 'cancelled') {
        await supabase
          .from('orders')
          .update({ 
            payment_status: internalStatus === 'rejected' ? 'failed' : 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
    }

    return new Response(JSON.stringify({ 
      received: true,
      processed: charges.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PagBank webhook error:', error);
    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ 
      received: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
