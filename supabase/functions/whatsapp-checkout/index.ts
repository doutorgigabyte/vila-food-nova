import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  session_id: string;
  delivery_type: 'delivery' | 'pickup' | 'table';
  payment_method: 'pix' | 'cash' | 'card' | 'credit' | 'debit';
  delivery_address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    cep?: string;
    complement?: string;
    latitude?: number;
    longitude?: number;
  };
  change_for?: number;
  observations?: string;
  table_number?: string;
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

    const body: CheckoutRequest = await req.json();
    const { 
      session_id, 
      delivery_type, 
      payment_method, 
      delivery_address, 
      change_for, 
      observations,
      table_number 
    } = body;

    console.log('Checkout request:', JSON.stringify(body, null, 2));

    // Get session with cart
    const { data: session, error: sessionError } = await supabase
      .from('whatsapp_sessions')
      .select('*, establishments(*)')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cart = session.cart as Array<{
      product_id: string;
      name: string;
      quantity: number;
      price: number;
      observations?: string;
    }>;

    if (!cart || cart.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Carrinho vazio',
        message: '🛒 Seu carrinho está vazio! Adicione alguns itens antes de finalizar o pedido.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const establishment = session.establishments;
    const establishmentId = session.establishment_id;

    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Check minimum order value
    if (subtotal < (establishment?.min_order_value || 0)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pedido mínimo não atingido',
        message: `⚠️ O pedido mínimo é de R$ ${establishment?.min_order_value?.toFixed(2)}. Seu carrinho está em R$ ${subtotal.toFixed(2)}.`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate delivery fee if delivery
    let deliveryFee = 0;
    let estimatedTime = establishment?.avg_delivery_time || 45;

    if (delivery_type === 'delivery' && delivery_address) {
      // Call calculate-delivery function if we have coordinates
      if (delivery_address.latitude && delivery_address.longitude) {
        try {
          const deliveryResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-delivery`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify({
                establishment_id: establishmentId,
                customer_lat: delivery_address.latitude,
                customer_lng: delivery_address.longitude,
                customer_cep: delivery_address.cep,
              }),
            }
          );

          if (deliveryResponse.ok) {
            const deliveryData = await deliveryResponse.json();
            if (deliveryData.success && deliveryData.can_deliver) {
              deliveryFee = deliveryData.delivery_fee || 0;
              estimatedTime = deliveryData.estimated_time || estimatedTime;
            } else if (!deliveryData.can_deliver) {
              return new Response(JSON.stringify({
                success: false,
                error: 'Endereço fora da área de entrega',
                message: '📍 Infelizmente não entregamos nessa localização. Considere a opção de retirada!',
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        } catch (e) {
          console.error('Error calculating delivery:', e);
          // Use default delivery fee
          deliveryFee = establishment?.delivery_base_fee || 5;
        }
      } else {
        // Use default delivery fee if no coordinates
        deliveryFee = establishment?.delivery_base_fee || 5;
      }
    }

    const total = subtotal + deliveryFee;

    // Find or create customer
    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', session.customer_phone)
      .eq('establishment_id', establishmentId)
      .single();

    if (!customer) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          establishment_id: establishmentId,
          name: session.customer_name || 'Cliente WhatsApp',
          phone: session.customer_phone,
          addresses: delivery_address ? [delivery_address] : [],
        })
        .select()
        .single();
      customer = newCustomer;
    }

    // Create order
    const orderItems = cart.map(item => ({
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      observations: item.observations,
    }));

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        establishment_id: establishmentId,
        customer_id: customer?.id,
        status: 'pending',
        delivery_type,
        payment_method: payment_method === 'pix' ? 'pix' : 
                       payment_method === 'cash' ? 'cash' : 
                       payment_method === 'card' || payment_method === 'credit' || payment_method === 'debit' ? 'card' : 'cash',
        items: orderItems,
        subtotal,
        delivery_fee: deliveryFee,
        discount: 0,
        total,
        delivery_address: delivery_type === 'delivery' ? delivery_address : null,
        change_for: payment_method === 'cash' ? change_for : null,
        estimated_time: estimatedTime,
        observations,
        table_number: delivery_type === 'table' ? table_number : null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw orderError;
    }

    // Clear cart and update session
    await supabase
      .from('whatsapp_sessions')
      .update({ 
        cart: [],
        context: {
          ...((session.context as object) || {}),
          last_order_id: order.id,
          last_order_number: order.order_number,
        }
      })
      .eq('id', session_id);

    // Log analytics
    await supabase.from('whatsapp_analytics').insert({
      establishment_id: establishmentId,
      session_id,
      event_type: 'order_created',
      event_data: {
        order_id: order.id,
        order_number: order.order_number,
        total,
        items_count: cart.length,
        delivery_type,
        payment_method,
      },
    });

    // Build confirmation message
    let confirmationMessage = `🎉 *Pedido #${order.order_number} confirmado!*\n\n`;
    confirmationMessage += `📋 *Itens:*\n`;
    cart.forEach(item => {
      confirmationMessage += `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    confirmationMessage += `\n`;
    confirmationMessage += `📦 *Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
    if (delivery_type === 'delivery') {
      confirmationMessage += `🚚 *Entrega:* R$ ${deliveryFee.toFixed(2)}\n`;
    }
    confirmationMessage += `💰 *Total:* R$ ${total.toFixed(2)}\n\n`;
    confirmationMessage += `💳 *Pagamento:* ${
      payment_method === 'pix' ? 'PIX' :
      payment_method === 'cash' ? `Dinheiro${change_for ? ` (troco para R$ ${change_for.toFixed(2)})` : ''}` :
      'Cartão'
    }\n`;
    confirmationMessage += `🕐 *Tempo estimado:* ${estimatedTime} minutos\n\n`;

    if (delivery_type === 'delivery' && delivery_address) {
      confirmationMessage += `📍 *Entregar em:*\n`;
      confirmationMessage += `${delivery_address.street}, ${delivery_address.number}\n`;
      confirmationMessage += `${delivery_address.neighborhood} - ${delivery_address.city}\n`;
      if (delivery_address.complement) {
        confirmationMessage += `Complemento: ${delivery_address.complement}\n`;
      }
    } else if (delivery_type === 'pickup') {
      confirmationMessage += `📍 *Retirar em:*\n${establishment?.address || 'Endereço do estabelecimento'}\n`;
    }

    confirmationMessage += `\nObrigado pela preferência! 🙏`;

    return new Response(JSON.stringify({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      total,
      subtotal,
      delivery_fee: deliveryFee,
      estimated_time: estimatedTime,
      message: confirmationMessage,
      payment_method,
      delivery_type,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ Ocorreu um erro ao processar seu pedido. Por favor, tente novamente ou aguarde um atendente.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
