import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  session_id: string;
  establishment_id?: string;
  instance_name?: string; // n8n sends instance_name instead of establishment_id
  remote_jid?: string; // n8n sends remote_jid for WhatsApp number
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
  // n8n specific fields
  use_dynamic_prompt?: boolean; // When true, uses establishment.system_prompt
  use_menu_json?: boolean; // When true, uses establishment.menu_json instead of products table
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
    const { 
      session_id, 
      establishment_id: rawEstablishmentId, 
      instance_name,
      remote_jid,
      message, 
      message_type, 
      ai_prompt, 
      ai_model, 
      context, 
      cart,
      use_dynamic_prompt,
      use_menu_json 
    } = body;
    const modelToUse = ai_model || 'google/gemini-2.5-flash';

    console.log('AI Request:', JSON.stringify(body, null, 2));

    // Resolve establishment - by ID or by instance_name (n8n multi-tenant)
    let establishment: Record<string, unknown> | null = null;
    let establishment_id = rawEstablishmentId;

    if (instance_name && !establishment_id) {
      // n8n multi-tenant: lookup by whatsapp_instance_name
      const { data: estByInstance } = await supabase
        .from('establishments')
        .select('*')
        .eq('whatsapp_instance_name', instance_name)
        .single();
      
      if (estByInstance) {
        establishment = estByInstance;
        establishment_id = estByInstance.id;
        console.log(`Resolved establishment by instance_name: ${instance_name} -> ${establishment_id}`);
      }
    } else if (establishment_id) {
      const { data: estById } = await supabase
        .from('establishments')
        .select('*')
        .eq('id', establishment_id)
        .single();
      establishment = estById;
    }

    if (!establishment) {
      console.error('Establishment not found:', { establishment_id, instance_name });
      return new Response(JSON.stringify({ 
        error: 'Establishment not found',
        response: 'Desculpe, não encontrei o estabelecimento. 🙏'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if using menu_json from establishment (n8n dynamic injection)
    let products: Array<Record<string, unknown>> = [];
    let menuFromJson = false;

    if (use_menu_json && establishment.menu_json) {
      // Use pre-generated menu_json from establishment
      menuFromJson = true;
      const menuJson = establishment.menu_json as Array<Record<string, unknown>>;
      products = menuJson.map(item => ({
        id: item.id,
        name: item.name || item.nome,
        description: item.description || item.descricao || '',
        price: item.price || item.preco,
        promotional_price: item.promotional_price || item.preco_promocional,
        image_url: item.image_url || item.img_url,
        category_id: null,
        is_active: true,
      }));
      console.log(`Using menu_json with ${products.length} products`);
    } else {
      // Fetch products from database
      const { data: dbProducts } = await supabase
        .from('products')
        .select('id, name, description, price, promotional_price, is_active, category_id, image_url')
        .eq('establishment_id', establishment_id)
        .eq('is_active', true)
        .order('name');
      products = dbProducts || [];
    }

    // Fetch categories (only if not using menu_json)
    let categories: Array<Record<string, unknown>> = [];
    if (!menuFromJson) {
      const { data: dbCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('establishment_id', establishment_id)
        .eq('is_active', true)
        .order('sort_order');
      categories = dbCategories || [];
    }

    // Build menu text for AI
    const menuByCategory: Record<string, Array<{ name: string; price: number; description: string; id: string; image_url?: string }>> = {};
    products?.forEach(product => {
      const category = categories?.find(c => c.id === (product as Record<string, unknown>).category_id);
      const categoryName = (category?.name as string) || 'Outros';
      if (!menuByCategory[categoryName]) {
        menuByCategory[categoryName] = [];
      }
      menuByCategory[categoryName].push({
        id: String((product as Record<string, unknown>).id || ''),
        name: String((product as Record<string, unknown>).name || ''),
        price: Number((product as Record<string, unknown>).promotional_price || (product as Record<string, unknown>).price || 0),
        description: String((product as Record<string, unknown>).description || ''),
        image_url: String((product as Record<string, unknown>).image_url || ''),
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

    // Build dynamic system prompt - prioritize establishment.system_prompt if use_dynamic_prompt is true
    const est = establishment as Record<string, unknown>;
    const basePrompt = (use_dynamic_prompt && est.system_prompt) 
      ? String(est.system_prompt) 
      : (ai_prompt || 'Você é um assistente virtual de atendimento.');

    const systemPrompt = `${basePrompt}

INFORMAÇÕES DO ESTABELECIMENTO:
- Nome: ${est.name || 'Estabelecimento'}
- Endereço: ${est.address || 'Não informado'}
- Telefone: ${est.phone || est.whatsapp || 'Não informado'}
- Aceita delivery: ${est.accepts_delivery ? 'Sim' : 'Não'}
- Aceita retirada: ${est.accepts_pickup ? 'Sim' : 'Não'}
- Valor mínimo: R$ ${Number(est.min_order_value || 0).toFixed(2)}
- Tempo médio de entrega: ${est.avg_delivery_time || 45} minutos

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

INSTRUÇÕES PARA ENVIO DE FOTOS:
- Quando o cliente perguntar "como é" ou "tem foto" de um produto, USE a função send_product_photo
- Quando estiver oferecendo um produto e quiser mostrar a aparência, USE send_product_photo
- Sempre envie a foto ANTES de pedir confirmação do cliente
- Use legendas atrativas como "Olha que delícia! 😋"

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
          name: "send_product_photo",
          description: "Envia a foto de um produto específico para o cliente. Use quando o cliente perguntar sobre a aparência de um produto ou quando estiver oferecendo um item",
          parameters: {
            type: "object",
            properties: {
              product_id: { type: "string", description: "ID do produto" },
              product_name: { type: "string", description: "Nome do produto" },
              caption: { type: "string", description: "Legenda para enviar junto com a foto" }
            },
            required: ["product_name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_menu",
          description: "Busca produtos no cardápio por nome ou descrição",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Termo de busca" }
            },
            required: ["query"]
          }
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
              cep: { type: "string", description: "CEP do cliente" },
              address: { type: "string", description: "Endereço completo" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_human",
          description: "Solicita atendimento humano quando a IA não consegue resolver",
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
      products_data: products?.map(p => {
        const prod = p as Record<string, unknown>;
        return {
          id: prod.id,
          name: prod.name,
          price: prod.promotional_price || prod.price,
          image_url: prod.image_url,
        };
      }),
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
