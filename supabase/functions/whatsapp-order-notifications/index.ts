import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusPayload {
  order_id: string;
  status: string;
  establishment_id?: string;
}

// Generate a secure review token
function generateReviewToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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
    const { order_id, status } = payload;

    console.log(`[whatsapp-order-notifications] Processing order ${order_id} with status ${status}`);

    // Fetch order details with customer and establishment
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        customer:customers(name, phone),
        establishment:establishments(id, name, slug, whatsapp, logo_url)
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

    // Check if WhatsApp tracking is enabled for this order
    if (!order.whatsapp_tracking_enabled) {
      console.log("[whatsapp-order-notifications] WhatsApp tracking not enabled for this order");
      return new Response(JSON.stringify({ success: false, reason: "Tracking not enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const establishmentId = order.establishment?.id || payload.establishment_id;

    // Fetch WhatsApp instance
    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("establishment_id", establishmentId)
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
      .eq("establishment_id", establishmentId)
      .eq("is_active", true);

    // Map status to event_type
    const statusEventMap: Record<string, string> = {
      pending: "order_received",
      confirmed: "order_confirmed",
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

    // Build order items summary
    let orderItemsSummary = "";
    if (order.items && Array.isArray(order.items)) {
      orderItemsSummary = order.items.map((item: any) => 
        `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}`
      ).join("\n");
    }

    // Generate review link for delivered status
    let ratingLink = "";
    if (status === "delivered") {
      const reviewToken = generateReviewToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

      // Save token to order
      await supabase
        .from("orders")
        .update({
          review_token: reviewToken,
          review_token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", order_id);

      // Build the review link - use the app domain
      const appDomain = Deno.env.get("APP_DOMAIN") || "vilafood.delivery";
      ratingLink = `https://${appDomain}/pedidos/${order_id}/avaliar/${reviewToken}`;
    }

    // Build delivery address string
    const deliveryAddress = order.delivery_address 
      ? `${order.delivery_address.address}, ${order.delivery_address.number}${order.delivery_address.complement ? ` - ${order.delivery_address.complement}` : ""}, ${order.delivery_address.neighborhood}`
      : "";

    // Replace placeholders in message
    let message = messageConfig.message_template;
    message = message.replace(/\{\{order_number\}\}/g, String(order.order_number));
    message = message.replace(/\{\{customer_name\}\}/g, order.customer?.name || order.customer_name || "Cliente");
    message = message.replace(/\{\{estimated_time\}\}/g, String(order.estimated_time || 45));
    message = message.replace(/\{\{establishment_name\}\}/g, order.establishment?.name || "");
    message = message.replace(/\{\{total\}\}/g, `R$ ${order.total?.toFixed(2).replace(".", ",")}`);
    message = message.replace(/\{\{order_items\}\}/g, orderItemsSummary);
    message = message.replace(/\{\{delivery_address\}\}/g, deliveryAddress);
    message = message.replace(/\{\{rating_link\}\}/g, ratingLink);
    message = message.replace(/\{\{is_delivery\}\}/g, order.delivery_type === "delivery" ? "true" : "");

    // Handle conditional blocks {{#if is_delivery}}...{{else}}...{{/if}}
    const conditionalRegex = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g;
    message = message.replace(conditionalRegex, (_match: string, condition: string, ifBlock: string, elseBlock: string) => {
      if (condition === "is_delivery") {
        return order.delivery_type === "delivery" ? ifBlock.trim() : elseBlock.trim();
      }
      if (condition === "cancellation_reason") {
        return order.cancellation_reason ? ifBlock.trim() : elseBlock.trim();
      }
      return "";
    });

    // Handle simple conditionals {{#if condition}}...{{/if}}
    const simpleConditionalRegex = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    message = message.replace(simpleConditionalRegex, (_match: string, condition: string, block: string) => {
      if (condition === "cancellation_reason" && order.cancellation_reason) {
        return block.replace(/\{\{cancellation_reason\}\}/g, order.cancellation_reason).trim();
      }
      return "";
    });

    // Get customer phone
    const customerPhone = order.customer_phone || order.customer?.phone || order.delivery_address?.phone;
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
      establishment_id: establishmentId,
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
      rating_link: ratingLink || undefined,
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
