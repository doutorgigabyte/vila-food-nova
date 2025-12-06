import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const PLATFORM_FEE_PERCENT = 5;

interface SplitItem {
  establishment_id: string;
  order_id: string;
  amount: number;
  mp_user_id?: string;
}

interface MultiSplitRequest {
  action: 'create_payment' | 'check_status' | 'process_transfers';
  checkout_id: string;
  total_amount?: number;
  items?: SplitItem[];
  payer_email?: string;
  payer_name?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const body: MultiSplitRequest = await req.json();
    const { action, checkout_id, total_amount, items, payer_email, payer_name, description } = body;

    console.log(`[multi-split] Action: ${action}, Checkout: ${checkout_id}`);

    switch (action) {
      case 'create_payment': {
        if (!items || items.length === 0 || !total_amount) {
          throw new Error('Items and total_amount are required');
        }

        // Calculate platform fee (5% of total)
        const platformFee = total_amount * (PLATFORM_FEE_PERCENT / 100);
        const netAmount = total_amount - platformFee;

        // Create payment_split record
        const { data: splitRecord, error: splitError } = await supabase
          .from('payment_splits')
          .insert({
            checkout_id,
            total_amount,
            platform_fee: platformFee,
            platform_fee_percent: PLATFORM_FEE_PERCENT,
            status: 'pending',
            payment_method: 'pix',
            payer_email,
            payer_name,
          })
          .select()
          .single();

        if (splitError) {
          console.error('[multi-split] Error creating split record:', splitError);
          throw new Error('Failed to create split record');
        }

        // Create split items for each establishment
        const splitItems = items.map(item => {
          const itemFee = item.amount * (PLATFORM_FEE_PERCENT / 100);
          return {
            split_id: splitRecord.id,
            establishment_id: item.establishment_id,
            order_id: item.order_id,
            amount: item.amount,
            establishment_fee: itemFee,
            net_amount: item.amount - itemFee,
            transfer_status: 'pending',
          };
        });

        const { error: itemsError } = await supabase
          .from('payment_split_items')
          .insert(splitItems);

        if (itemsError) {
          console.error('[multi-split] Error creating split items:', itemsError);
        }

        // Create PIX payment via Mercado Pago (goes to platform account)
        const pixPayload = {
          transaction_amount: total_amount,
          description: description || `Pedido Multi-Vila ${checkout_id}`,
          payment_method_id: 'pix',
          payer: {
            email: payer_email || 'cliente@vilafood.com',
            first_name: payer_name?.split(' ')[0] || 'Cliente',
            last_name: payer_name?.split(' ').slice(1).join(' ') || 'VilaFood',
          },
          external_reference: `multi_${checkout_id}`,
        };

        console.log('[multi-split] Creating PIX payment:', pixPayload);

        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `multi_${checkout_id}_${Date.now()}`,
          },
          body: JSON.stringify(pixPayload),
        });

        const mpData = await mpResponse.json();
        console.log('[multi-split] MP Response:', mpData);

        if (!mpResponse.ok) {
          throw new Error(mpData.message || 'Failed to create payment');
        }

        // Update split record with MP payment ID
        await supabase
          .from('payment_splits')
          .update({ mp_payment_id: mpData.id?.toString() })
          .eq('id', splitRecord.id);

        // Log transaction
        await supabase.from('mp_transactions').insert({
          type: 'multi_split',
          mp_payment_id: mpData.id?.toString(),
          amount: total_amount,
          platform_fee: platformFee,
          net_amount: netAmount,
          status: mpData.status,
          payer_email,
          payer_name,
          metadata: { checkout_id, items_count: items.length },
        });

        return new Response(JSON.stringify({
          success: true,
          split_id: splitRecord.id,
          payment_id: mpData.id,
          status: mpData.status,
          qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
          expiration: mpData.date_of_expiration,
          total_amount,
          platform_fee: platformFee,
          items: items.map(i => ({
            establishment_id: i.establishment_id,
            amount: i.amount,
            net_amount: i.amount * (1 - PLATFORM_FEE_PERCENT / 100),
          })),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_status': {
        // Get split record
        const { data: split, error: splitError } = await supabase
          .from('payment_splits')
          .select('*, payment_split_items(*)')
          .eq('checkout_id', checkout_id)
          .single();

        if (splitError || !split) {
          throw new Error('Split record not found');
        }

        if (!split.mp_payment_id) {
          return new Response(JSON.stringify({
            success: true,
            status: split.status,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check payment status with MP
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${split.mp_payment_id}`, {
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          },
        });

        const mpData = await mpResponse.json();
        const newStatus = mpData.status === 'approved' ? 'paid' : mpData.status;

        // Update split status if changed
        if (split.status !== newStatus) {
          await supabase
            .from('payment_splits')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', split.id);

          // If approved, trigger transfers
          if (mpData.status === 'approved') {
            console.log('[multi-split] Payment approved, triggering transfers...');
            // Transfers will be processed by webhook or manual trigger
          }
        }

        return new Response(JSON.stringify({
          success: true,
          status: newStatus,
          mp_status: mpData.status,
          split_id: split.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'process_transfers': {
        // Get split record with items
        const { data: split, error: splitError } = await supabase
          .from('payment_splits')
          .select(`
            *,
            payment_split_items(
              *,
              establishments(mp_user_id, name, whatsapp)
            )
          `)
          .eq('checkout_id', checkout_id)
          .single();

        if (splitError || !split) {
          throw new Error('Split record not found');
        }

        if (split.status !== 'paid') {
          throw new Error('Payment not yet approved');
        }

        const transferResults = [];

        for (const item of split.payment_split_items) {
          if (item.transfer_status === 'transferred') {
            console.log(`[multi-split] Item ${item.id} already transferred, skipping`);
            continue;
          }

          const establishment = item.establishments;
          if (!establishment?.mp_user_id) {
            console.log(`[multi-split] Establishment ${item.establishment_id} has no MP account, skipping`);
            transferResults.push({
              establishment_id: item.establishment_id,
              success: false,
              error: 'No MP account linked',
            });
            continue;
          }

          try {
            // Create transfer to establishment
            const transferPayload = {
              amount: Math.round(item.net_amount * 100), // Convert to cents
              currency_id: 'BRL',
              description: `Repasse pedido ${item.order_id}`,
              user_id: parseInt(establishment.mp_user_id),
            };

            console.log(`[multi-split] Creating transfer to ${establishment.name}:`, transferPayload);

            const transferResponse = await fetch('https://api.mercadopago.com/v1/account/bank_report/transfer', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(transferPayload),
            });

            const transferData = await transferResponse.json();

            if (transferResponse.ok) {
              // Update item with transfer info
              await supabase
                .from('payment_split_items')
                .update({
                  mp_transfer_id: transferData.id?.toString(),
                  transfer_status: 'transferred',
                  transferred_at: new Date().toISOString(),
                })
                .eq('id', item.id);

              transferResults.push({
                establishment_id: item.establishment_id,
                establishment_name: establishment.name,
                success: true,
                transfer_id: transferData.id,
                amount: item.net_amount,
              });

              // Notify establishment via WhatsApp
              if (establishment.whatsapp) {
                try {
                  await supabase.functions.invoke('whatsapp-notification', {
                    body: {
                      phone: establishment.whatsapp,
                      message: `💰 *Pagamento Recebido!*\n\nVocê recebeu R$ ${item.net_amount.toFixed(2)} do pedido multi-vila.\n\nO valor será creditado em sua conta Mercado Pago.`,
                      type: 'establishment',
                    },
                  });
                } catch (e) {
                  console.error('[multi-split] WhatsApp notification error:', e);
                }
              }
            } else {
              console.error(`[multi-split] Transfer failed:`, transferData);
              transferResults.push({
                establishment_id: item.establishment_id,
                success: false,
                error: transferData.message || 'Transfer failed',
              });
            }
          } catch (transferError: any) {
            console.error(`[multi-split] Transfer error:`, transferError);
            transferResults.push({
              establishment_id: item.establishment_id,
              success: false,
              error: transferError?.message || 'Unknown error',
            });
          }
        }

        // Check if all transfers completed
        const allTransferred = transferResults.every(r => r.success);
        if (allTransferred) {
          await supabase
            .from('payment_splits')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', split.id);
        }

        return new Response(JSON.stringify({
          success: true,
          transfers: transferResults,
          all_completed: allTransferred,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('[multi-split] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
