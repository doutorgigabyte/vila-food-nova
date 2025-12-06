import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface RecommendationRequest {
  establishment_id: string;
  cart_items: CartItem[];
  limit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { establishment_id, cart_items, limit = 3 }: RecommendationRequest = await req.json();
    
    // Input validation to prevent abuse
    if (!establishment_id || typeof establishment_id !== 'string') {
      return new Response(
        JSON.stringify({ error: "establishment_id inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!Array.isArray(cart_items) || cart_items.length === 0) {
      return new Response(
        JSON.stringify({ error: "cart_items deve ser um array não vazio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Limit cart items to prevent large payload abuse
    if (cart_items.length > 50) {
      return new Response(
        JSON.stringify({ error: "Máximo de 50 itens no carrinho" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active products from the establishment
    const { data: allProducts, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        promotional_price,
        image_url,
        category_id,
        categories (name)
      `)
      .eq("establishment_id", establishment_id)
      .eq("is_active", true);

    if (productsError) throw productsError;
    if (!allProducts || allProducts.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "Nenhum produto disponível" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get cart item IDs to exclude from recommendations
    const cartItemIds = cart_items.map(item => item.id);
    const availableProducts = allProducts.filter(p => !cartItemIds.includes(p.id));

    if (availableProducts.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "Você já adicionou todos os produtos!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context for AI
    const cartSummary = cart_items.map(item => 
      `${item.quantity}x ${item.name} (${item.category || 'sem categoria'}) - R$ ${(item.price * item.quantity).toFixed(2)}`
    ).join("\n");

    const productsList = availableProducts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.promotional_price || p.price,
      category: (p.categories as any)?.name || "Sem categoria"
    }));

    const systemPrompt = `Você é um assistente de vendas inteligente para um restaurante/delivery. Sua função é recomendar produtos complementares baseados no carrinho do cliente.

REGRAS IMPORTANTES:
1. Recomende produtos que COMPLEMENTEM o que o cliente já está comprando
2. Para lanches/hambúrgueres: sugira batatas fritas, bebidas, sobremesas
3. Para pizzas: sugira bebidas, bordas recheadas, sobremesas
4. Para bebidas: sugira petiscos, porções
5. Considere a quantidade no carrinho: se tem 2 hambúrgueres, sugira bebida para 2 pessoas
6. Seja breve e persuasivo nas justificativas (máximo 50 caracteres)
7. Priorize promoções quando disponíveis
8. Retorne APENAS JSON válido, sem markdown`;

    const userPrompt = `CARRINHO ATUAL DO CLIENTE:
${cartSummary}

PRODUTOS DISPONÍVEIS PARA RECOMENDAR:
${JSON.stringify(productsList, null, 2)}

Retorne um JSON com até ${limit} recomendações no formato:
{
  "recommendations": [
    {
      "product_id": "id_do_produto",
      "reason": "Breve justificativa da recomendação"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições, tente novamente em alguns segundos" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse AI response
    let aiRecommendations: { product_id: string; reason: string }[] = [];
    try {
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanContent);
      aiRecommendations = parsed.recommendations || [];
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback: return random products
      aiRecommendations = availableProducts.slice(0, limit).map(p => ({
        product_id: p.id,
        reason: "Combina com seu pedido!"
      }));
    }

    // Enrich recommendations with full product data
    const recommendations = aiRecommendations
      .map(rec => {
        const product = availableProducts.find(p => p.id === rec.product_id);
        if (!product) return null;
        return {
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            promotional_price: product.promotional_price,
            image_url: product.image_url,
            category: (product.categories as any)?.name
          },
          reason: rec.reason
        };
      })
      .filter(Boolean);

    return new Response(
      JSON.stringify({ 
        recommendations,
        ai_powered: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar recomendações" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
