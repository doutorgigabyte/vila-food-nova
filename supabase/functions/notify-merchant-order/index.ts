import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderNotification {
  order_id: string;
  establishment_id: string;
  notification_type: 'new_order' | 'payment_pending' | 'order_cancelled' | 'low_stock';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!;
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { order_id, establishment_id, notification_type } = await req.json() as OrderNotification;

    // Get establishment data
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('name, phone, whatsapp, owner_id')
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment) {
      console.error('Establishment not found:', estError);
      return new Response(
        JSON.stringify({ error: 'Establishment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WhatsApp instance for this establishment
    const { data: whatsappInstance } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, api_key, status')
      .eq('establishment_id', establishment_id)
      .eq('status', 'connected')
      .single();

    // Get owner profile for phone (to send notification TO)
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', establishment.owner_id)
      .single();

    const merchantPhone = establishment.whatsapp || establishment.phone || profile?.phone;

    if (!merchantPhone) {
      console.error('No phone found for merchant');
      return new Response(
        JSON.stringify({ success: true, message: 'Notification skipped (no merchant phone)', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order details if order_id provided
    let orderDetails = null;
    if (order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, total, customer_name, delivery_type, items, created_at')
        .eq('id', order_id)
        .single();
      orderDetails = order;
    }

    // Build message based on notification type
    let message = '';
    const storeName = establishment.name;

    switch (notification_type) {
      case 'new_order':
        if (orderDetails) {
          const itemCount = Array.isArray(orderDetails.items) ? orderDetails.items.length : 0;
          const deliveryLabel = orderDetails.delivery_type === 'pickup' ? 'Retirada' : 
                               orderDetails.delivery_type === 'turbo' ? '⚡ Turbo' : 'Delivery';
          message = `🔔 *NOVO PEDIDO - ${storeName}*\n\n` +
                   `👤 Cliente: ${orderDetails.customer_name || 'Não informado'}\n` +
                   `📦 Itens: ${itemCount} produto(s)\n` +
                   `💰 Total: R$ ${orderDetails.total?.toFixed(2)}\n` +
                   `🚚 Tipo: ${deliveryLabel}\n\n` +
                   `⏰ Acesse o painel para confirmar o pedido!`;
        } else {
          message = `🔔 *NOVO PEDIDO - ${storeName}*\n\nVocê recebeu um novo pedido! Acesse o painel para ver os detalhes.`;
        }
        break;

      case 'payment_pending':
        message = `💳 *PAGAMENTO PENDENTE - ${storeName}*\n\n` +
                 `Você tem pagamentos pendentes que precisam de atenção.\n\n` +
                 `Acesse o painel financeiro para regularizar.`;
        break;

      case 'order_cancelled':
        message = `❌ *PEDIDO CANCELADO - ${storeName}*\n\n` +
                 `Um pedido foi cancelado pelo cliente.\n\n` +
                 `Acesse o painel para ver os detalhes.`;
        break;

      case 'low_stock':
        message = `⚠️ *ESTOQUE BAIXO - ${storeName}*\n\n` +
                 `Alguns produtos estão com estoque baixo.\n\n` +
                 `Acesse o painel de estoque para repor.`;
        break;

      default:
        message = `📢 *${storeName}*\n\nVocê tem uma nova notificação. Acesse o painel para mais detalhes.`;
    }

    // Use establishment's WhatsApp instance if available, otherwise use system instance
    const instanceName = whatsappInstance?.instance_name || 'Doutorgigabyte';
    const instanceApiKey = whatsappInstance?.api_key || evolutionApiKey;
    
    const formattedPhone = merchantPhone.replace(/\D/g, '');
    const phoneWithCountry = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

    console.log(`Sending notification via instance: ${instanceName} to phone: ${phoneWithCountry}`);

    let notificationSent = false;
    let notificationError = null;

    try {
      const sendResponse = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': instanceApiKey,
        },
        body: JSON.stringify({
          number: phoneWithCountry,
          text: message,
        }),
      });

      if (!sendResponse.ok) {
        const errorData = await sendResponse.text();
        console.error('Evolution API error (non-blocking):', errorData);
        notificationError = errorData;
      } else {
        notificationSent = true;
        console.log(`Merchant notification sent to ${phoneWithCountry} for ${notification_type}`);
      }
    } catch (whatsappError) {
      console.error('WhatsApp send failed (non-blocking):', whatsappError);
      notificationError = whatsappError instanceof Error ? whatsappError.message : 'Unknown error';
    }

    // Log the notification attempt (success or failure)
    await supabase.from('audit_logs').insert({
      action: notificationSent ? 'merchant_notification_sent' : 'merchant_notification_failed',
      entity_type: 'order',
      entity_id: order_id,
      metadata: { 
        establishment_id, 
        notification_type, 
        phone: phoneWithCountry,
        success: notificationSent,
        error: notificationError,
      },
    });

    // Always return success - notification failure should not block order flow
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: notificationSent ? 'Notification sent' : 'Notification failed but order continues',
        notification_sent: notificationSent,
        notification_error: notificationError,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in notify-merchant-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
