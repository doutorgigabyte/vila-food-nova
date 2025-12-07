import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  session_id: string;
  establishment_id: string;
  message: string;
  message_type?: string;
  ai_prompt?: string;
  ai_model?: string;
  context?: Record<string, unknown>;
  cart?: Array<{
    product_id: string;
    name: string;
    quantity: number;
    price: number;
    observations?: string;
  }>;
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const body: AIRequest = await req.json();
    const { session_id, establishment_id, message, message_type, ai_prompt, ai_model, context, cart } = body;
    const modelToUse = ai_model || 'google/gemini-2.5-flash';

    console.log('AI Request:', JSON.stringify(body, null, 2));

    // Fetch establishment info
    const { data: establishment } = await supabase
      .from('establishments')
      .select('*')
      .eq('id', establishment_id)
      .single();

    // Fetch products/menu
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price, promotional_price, is_active, category_id, image_url')
      .eq('establishment_id', establishment_id)
      .eq('is_active', true)
      .order('name');

    // Fetch categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('establishment_id', establishment_id)
      .eq('is_active', true)
      .order('sort_order');

    // Build menu text for AI
    const menuByCategory: Record<string, Array<{ name: string; price: number; description: string; id: string }>> = {};
    products?.forEach(product => {
      const category = categories?.find(c => c.id === product.category_id);
      const categoryName = category?.name || 'Outros';
      if (!menuByCategory[categoryName]) {
        menuByCategory[categoryName] = [];
      }
      menuByCategory[categoryName].push({
        id: product.id,
        name: product.name,
        price: product.promotional_price || product.price,
        description: product.description || '',
      });
    });

    let menuText = '\n\n📋 CARDÁPIO:\n';
    Object.entries(menuByCategory).forEach(([category, items]) => {
      menuText += `\n**${category}**\n`;
      items.forEach(item => {
        menuText += `- ${item.name}: R$ ${item.price.toFixed(2)}${item.description ? ` (${item.description})` : ''}\n`;
      });
    });

    // Build cart summary
    let cartText = '';
    if (cart && cart.length > 0) {
      const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cartText = '\n\n🛒 CARRINHO ATUAL:\n';
      cart.forEach(item => {
        cartText += `- ${item.quantity}x ${item.name}: R$ ${(item.price * item.quantity).toFixed(2)}\n`;
      });
      cartText += `Total: R$ ${cartTotal.toFixed(2)}\n`;
    }

    // System prompt
    const systemPrompt = `${ai_prompt || 'Você é um assistente virtual de atendimento.'}

INFORMAÇÕES DO ESTABELECIMENTO:
- Nome: ${establishment?.name || 'Estabelecimento'}
- Endereço: ${establishment?.address || 'Não informado'}
- Telefone: ${establishment?.phone || establishment?.whatsapp || 'Não informado'}
- Aceita delivery: ${establishment?.accepts_delivery ? 'Sim' : 'Não'}
- Aceita retirada: ${establishment?.accepts_pickup ? 'Sim' : 'Não'}
- Valor mínimo: R$ ${establishment?.min_order_value?.toFixed(2) || '0.00'}
- Tempo médio de entrega: ${establishment?.avg_delivery_time || 45} minutos

${menuText}
${cartText}

INSTRUÇÕES IMPORTANTES:
1. Seja sempre educado e prestativo
2. Quando o cliente pedir para adicionar algo ao carrinho, responda com a função add_to_cart
3. Quando o cliente pedir para ver o carrinho, mostre o conteúdo atual
4. Para finalizar pedido, use a função checkout
5. Se o cliente enviar localização, calcule o frete
6. Sempre confirme os itens antes de finalizar
7. Use emojis para deixar a conversa mais amigável
8. Se não souber responder, peça para aguardar atendimento humano

CONTEXTO DA CONVERSA:
${JSON.stringify(context || {})}`;

    // Define tools for function calling
    const tools = [
      {
        type: "function",
        function: {
          name: "add_to_cart",
          description: "Adiciona um produto ao carrinho do cliente",
          parameters: {
            type: "object",
            properties: {
              product_name: { type: "string", description: "Nome do produto" },
              quantity: { type: "number", description: "Quantidade" },
              observations: { type: "string", description: "Observações do cliente" }
            },
            required: ["product_name", "quantity"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "remove_from_cart",
          description: "Remove um produto do carrinho",
          parameters: {
            type: "object",
            properties: {
              product_name: { type: "string", description: "Nome do produto a remover" }
            },
            required: ["product_name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "view_cart",
          description: "Mostra o carrinho atual do cliente",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "checkout",
          description: "Inicia o processo de finalização do pedido",
          parameters: {
            type: "object",
            properties: {
              delivery_type: { type: "string", enum: ["delivery", "pickup"], description: "Tipo de entrega" },
              payment_method: { type: "string", enum: ["pix", "cash", "card"], description: "Forma de pagamento" }
            },
            required: ["delivery_type", "payment_method"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "calculate_delivery",
          description: "Calcula o frete baseado na localização do cliente",
          parameters: {
            type: "object",
            properties: {
              latitude: { type: "number", description: "Latitude do cliente" },
              longitude: { type: "number", description: "Longitude do cliente" },
              cep: { type: "string", description: "CEP do cliente" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_human",
          description: "Solicita atendimento humano",
          parameters: {
            type: "object",
            properties: {
              reason: { type: "string", description: "Motivo da solicitação" }
            }
          }
        }
      }
    ];

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded', 
          response: 'Desculpe, estou sobrecarregado no momento. Por favor, tente novamente em alguns segundos. ⏳'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required', 
          response: 'Serviço temporariamente indisponível. Por favor, aguarde um atendente. 🙏'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('Lovable AI Response:', JSON.stringify(aiData, null, 2));

    const choice = aiData.choices?.[0];
    const assistantMessage = choice?.message;
    
    let responseText = assistantMessage?.content || '';
    const toolCalls = assistantMessage?.tool_calls || [];
    
    if (!responseText && toolCalls.length === 0) {
      responseText = 'Desculpe, não entendi. Pode repetir?';
    }

    // Process tool calls
    const actions: Array<{ action: string; params: Record<string, unknown> }> = [];
    
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function?.name;
      const functionArgs = JSON.parse(toolCall.function?.arguments || '{}');
      
      actions.push({
        action: functionName,
        params: functionArgs,
      });
    }

    // Save AI response as message
    await supabase.from('whatsapp_messages').insert({
      session_id,
      sender: 'bot',
      content: responseText,
      message_type: 'text',
      is_from_bot: true,
    });

    // Log analytics
    await supabase.from('whatsapp_analytics').insert({
      establishment_id,
      session_id,
      event_type: 'ai_response',
      event_data: {
        user_message: message,
        ai_response: responseText,
        tool_calls: actions,
        tokens_used: aiData.usage,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      response: responseText,
      actions,
      products_data: products?.map(p => ({
        id: p.id,
        name: p.name,
        price: p.promotional_price || p.price,
        image_url: p.image_url,
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Response error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      response: 'Desculpe, ocorreu um erro. Por favor, aguarde um atendente. 🙏'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
