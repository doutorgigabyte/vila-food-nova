import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusPayload {
  order_id: string;
  status: string;
  establishment_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: OrderStatusPayload = await req.json();
    const { order_id, status, establishment_id } = payload;

    console.log(`[whatsapp-order-notifications] Processing order ${order_id} with status ${status}`);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        customer:customers(name, phone),
        establishment:establishments(name, slug, whatsapp)
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("[whatsapp-order-notifications] Order not found:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch WhatsApp instance
    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("establishment_id", establishment_id)
      .maybeSingle();

    if (!instance || instance.status !== "connected") {
      console.log("[whatsapp-order-notifications] WhatsApp not connected for establishment");
      return new Response(JSON.stringify({ success: false, reason: "WhatsApp not connected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch auto messages configuration
    const { data: autoMessages } = await supabase
      .from("whatsapp_auto_messages")
      .select("*")
      .eq("establishment_id", establishment_id)
      .eq("is_active", true);

    // Map status to event_type
    const statusEventMap: Record<string, string> = {
      confirmed: "order_confirmation",
      preparing: "order_preparing",
      ready: "order_ready",
      out_for_delivery: "order_out_for_delivery",
      delivered: "order_delivered",
      cancelled: "order_cancelled",
    };

    const eventType = statusEventMap[status];
    if (!eventType) {
      console.log(`[whatsapp-order-notifications] No notification configured for status: ${status}`);
      return new Response(JSON.stringify({ success: false, reason: "No event mapping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the message template
    const messageConfig = autoMessages?.find(m => m.event_type === eventType);
    if (!messageConfig) {
      console.log(`[whatsapp-order-notifications] No auto message for event: ${eventType}`);
      return new Response(JSON.stringify({ success: false, reason: "No auto message configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Replace placeholders in message
    let message = messageConfig.message_template;
    message = message.replace(/\{\{order_number\}\}/g, String(order.order_number));
    message = message.replace(/\{\{customer_name\}\}/g, order.customer?.name || "Cliente");
    message = message.replace(/\{\{estimated_time\}\}/g, String(order.estimated_time || 45));
    message = message.replace(/\{\{establishment_name\}\}/g, order.establishment?.name || "");
    message = message.replace(/\{\{total\}\}/g, `R$ ${order.total?.toFixed(2).replace(".", ",")}`);

    // Get customer phone
    const customerPhone = order.customer?.phone || order.delivery_address?.phone;
    if (!customerPhone) {
      console.log("[whatsapp-order-notifications] No customer phone found");
      return new Response(JSON.stringify({ success: false, reason: "No customer phone" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone number (remove non-digits, add country code if needed)
    let formattedPhone = customerPhone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

    // Send message via Evolution API
    const apiUrl = instance.evolution_api_url || evolutionApiUrl;
    const apiKey = instance.evolution_api_key || evolutionApiKey;

    if (!apiUrl || !apiKey) {
      console.error("[whatsapp-order-notifications] Evolution API not configured");
      return new Response(JSON.stringify({ error: "Evolution API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sendResponse = await fetch(`${apiUrl}/message/sendText/${instance.instance_name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
      },
      body: JSON.stringify({
        number: formattedPhone,
        textMessage: { text: message },
      }),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("[whatsapp-order-notifications] Failed to send message:", errorText);
      return new Response(JSON.stringify({ error: "Failed to send message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the notification
    await supabase.from("whatsapp_conversations").insert({
      establishment_id,
      customer_phone: formattedPhone,
      message_type: "outbound",
      message_content: message,
      is_bot_message: true,
    });

    console.log(`[whatsapp-order-notifications] Notification sent for order ${order_id} (${status})`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notification sent",
      order_id,
      status,
      phone: formattedPhone,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("[whatsapp-order-notifications] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
