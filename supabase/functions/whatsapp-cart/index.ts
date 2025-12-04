import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
  observations?: string;
}

interface CartRequest {
  session_id: string;
  action: 'get' | 'add' | 'update' | 'remove' | 'clear';
  product_name?: string;
  product_id?: string;
  quantity?: number;
  observations?: string;
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

    const body: CartRequest = await req.json();
    const { session_id, action, product_name, product_id, quantity, observations } = body;

    console.log('Cart request:', JSON.stringify(body, null, 2));

    // Get current session
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

    let cart: CartItem[] = (session.cart as CartItem[]) || [];
    const establishmentId = session.establishment_id;

    switch (action) {
      case 'get': {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return new Response(JSON.stringify({
          success: true,
          cart,
          total,
          items_count: cart.reduce((sum, item) => sum + item.quantity, 0),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'add': {
        // Find product by name or ID
        let productQuery = supabase
          .from('products')
          .select('id, name, price, promotional_price, image_url')
          .eq('establishment_id', establishmentId)
          .eq('is_active', true);

        if (product_id) {
          productQuery = productQuery.eq('id', product_id);
        } else if (product_name) {
          productQuery = productQuery.ilike('name', `%${product_name}%`);
        }

        const { data: products } = await productQuery.limit(1);

        if (!products || products.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Produto não encontrado',
            message: `Não encontrei "${product_name}" no cardápio. Posso ajudar com outra coisa?`,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const product = products[0];
        const productPrice = product.promotional_price || product.price;
        const qty = quantity || 1;

        // Check if product already in cart
        const existingIndex = cart.findIndex(item => item.product_id === product.id);

        if (existingIndex >= 0) {
          cart[existingIndex].quantity += qty;
          if (observations) {
            cart[existingIndex].observations = observations;
          }
        } else {
          cart.push({
            product_id: product.id,
            name: product.name,
            quantity: qty,
            price: productPrice,
            image_url: product.image_url,
            observations,
          });
        }

        // Update session cart
        await supabase
          .from('whatsapp_sessions')
          .update({ cart })
          .eq('id', session_id);

        // Log analytics
        await supabase.from('whatsapp_analytics').insert({
          establishment_id: establishmentId,
          session_id,
          event_type: 'cart_add',
          event_data: {
            product_id: product.id,
            product_name: product.name,
            quantity: qty,
            price: productPrice,
          },
        });

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return new Response(JSON.stringify({
          success: true,
          message: `✅ Adicionado: ${qty}x ${product.name} - R$ ${(productPrice * qty).toFixed(2)}`,
          cart,
          total,
          added_item: {
            product_id: product.id,
            name: product.name,
            quantity: qty,
            price: productPrice,
            image_url: product.image_url,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const index = cart.findIndex(item => 
          item.product_id === product_id || 
          item.name.toLowerCase().includes((product_name || '').toLowerCase())
        );

        if (index < 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Item não encontrado no carrinho',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (quantity && quantity > 0) {
          cart[index].quantity = quantity;
          if (observations !== undefined) {
            cart[index].observations = observations;
          }
        } else {
          cart.splice(index, 1);
        }

        await supabase
          .from('whatsapp_sessions')
          .update({ cart })
          .eq('id', session_id);

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return new Response(JSON.stringify({
          success: true,
          message: quantity && quantity > 0 
            ? `✅ Quantidade atualizada` 
            : `🗑️ Item removido do carrinho`,
          cart,
          total,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'remove': {
        const index = cart.findIndex(item => 
          item.product_id === product_id || 
          item.name.toLowerCase().includes((product_name || '').toLowerCase())
        );

        if (index < 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Item não encontrado no carrinho',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const removedItem = cart.splice(index, 1)[0];

        await supabase
          .from('whatsapp_sessions')
          .update({ cart })
          .eq('id', session_id);

        // Log analytics
        await supabase.from('whatsapp_analytics').insert({
          establishment_id: establishmentId,
          session_id,
          event_type: 'cart_remove',
          event_data: { removed_item: removedItem },
        });

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return new Response(JSON.stringify({
          success: true,
          message: `🗑️ Removido: ${removedItem.name}`,
          cart,
          total,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'clear': {
        await supabase
          .from('whatsapp_sessions')
          .update({ cart: [] })
          .eq('id', session_id);

        return new Response(JSON.stringify({
          success: true,
          message: '🗑️ Carrinho esvaziado',
          cart: [],
          total: 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Cart error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
