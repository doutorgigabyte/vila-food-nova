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

// ==================== Authentication Helper ====================
async function authenticateRequest(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.log("[ai-recommendations] Auth failed:", error?.message);
    return null;
  }
  
  return { userId: user.id };
}

// ==================== Gemini Text API Call ====================
async function callGeminiText(systemPrompt: string, userPrompt: string): Promise<string> {
  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ai-recommendations] Gemini error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ==================== Fallback: Lovable AI Gateway ====================
async function callLovableText(systemPrompt: string, userPrompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  console.log("[ai-recommendations] Using Lovable AI Gateway fallback...");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (response.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ==================== Authentication Required ====================
    const auth = await authenticateRequest(req);
    
    if (!auth) {
      console.log("[ai-recommendations] Unauthorized request rejected");
      return new Response(
        JSON.stringify({ error: "Unauthorized - authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { establishment_id, cart_items, limit = 3 }: RecommendationRequest = await req.json();
    
    // Validation
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
    
    if (cart_items.length > 50) {
      return new Response(
        JSON.stringify({ error: "Máximo de 50 itens no carrinho" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[ai-recommendations] Authenticated user ${auth.userId} requesting recommendations`);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch products
    const { data: allProducts, error: productsError } = await supabase
      .from("products")
      .select(`id, name, description, price, promotional_price, image_url, category_id, categories (name)`)
      .eq("establishment_id", establishment_id)
      .eq("is_active", true);

    if (productsError) throw productsError;
    
    if (!allProducts?.length) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "Nenhum produto disponível" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out cart items
    const cartItemIds = cart_items.map(item => item.id);
    const availableProducts = allProducts.filter(p => !cartItemIds.includes(p.id));

    if (availableProducts.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "Você já adicionou todos os produtos!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build AI context
    const cartSummary = cart_items.map(item => 
      `${item.quantity}x ${item.name} (${item.category || 'sem categoria'}) - R$ ${(item.price * item.quantity).toFixed(2)}`
    ).join("\n");

    const productsList = availableProducts.slice(0, 30).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description?.substring(0, 100),
      price: p.promotional_price || p.price,
      category: (p.categories as any)?.name || "Sem categoria"
    }));

    const systemPrompt = `Você é um assistente de vendas inteligente para um delivery. Recomende produtos complementares.

REGRAS:
1. Recomende produtos que COMPLEMENTEM o carrinho
2. Lanches → sugira bebidas, batatas, sobremesas
3. Pizzas → sugira bebidas, bordas, sobremesas
4. Considere quantidade: 2 hambúrgueres = sugerir para 2 pessoas
5. Priorize promoções
6. Justificativas curtas (máx 40 caracteres)
7. Retorne APENAS JSON válido`;

    const userPrompt = `CARRINHO:
${cartSummary}

PRODUTOS DISPONÍVEIS:
${JSON.stringify(productsList)}

Retorne até ${limit} recomendações:
{"recommendations": [{"product_id": "id", "reason": "justificativa curta"}]}`;

    // Use Lovable AI Gateway (primary) with fallback
    let content = "";
    let engine = "lovable";
    
    try {
      content = await callLovableText(systemPrompt, userPrompt);
    } catch (lovableError) {
      console.log("[ai-recommendations] Lovable AI failed, trying Gemini:", lovableError);
      
      if (lovableError instanceof Error && (lovableError.message === "RATE_LIMIT" || lovableError.message === "PAYMENT_REQUIRED")) {
        // Try Gemini as fallback
        try {
          content = await callGeminiText(systemPrompt, userPrompt);
          engine = "gemini";
        } catch (geminiError) {
          // Ultimate fallback: random products
          console.log("[ai-recommendations] All AI failed, using random fallback");
          const randomRecs = availableProducts.slice(0, limit).map(p => ({
            product: {
              id: p.id, name: p.name, description: p.description,
              price: p.price, promotional_price: p.promotional_price,
              image_url: p.image_url, category: (p.categories as any)?.name
            },
            reason: "Combina com seu pedido!"
          }));
          
          return new Response(
            JSON.stringify({ recommendations: randomRecs, ai_powered: false, engine: "fallback" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Ultimate fallback: random products
        console.log("[ai-recommendations] All AI failed, using random fallback");
        const randomRecs = availableProducts.slice(0, limit).map(p => ({
          product: {
            id: p.id, name: p.name, description: p.description,
            price: p.price, promotional_price: p.promotional_price,
            image_url: p.image_url, category: (p.categories as any)?.name
          },
          reason: "Combina com seu pedido!"
        }));
        
        return new Response(
          JSON.stringify({ recommendations: randomRecs, ai_powered: false, engine: "fallback" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse AI response
    let aiRecommendations: { product_id: string; reason: string }[] = [];
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanContent);
      aiRecommendations = parsed.recommendations || [];
    } catch {
      console.error("[ai-recommendations] Parse failed:", content.substring(0, 200));
      aiRecommendations = availableProducts.slice(0, limit).map(p => ({
        product_id: p.id,
        reason: "Combina com seu pedido!"
      }));
    }

    // Enrich with product data
    const recommendations = aiRecommendations
      .map(rec => {
        const product = availableProducts.find(p => p.id === rec.product_id);
        if (!product) return null;
        return {
          product: {
            id: product.id, name: product.name, description: product.description,
            price: product.price, promotional_price: product.promotional_price,
            image_url: product.image_url, category: (product.categories as any)?.name
          },
          reason: rec.reason
        };
      })
      .filter(Boolean);

    console.log(`[ai-recommendations] Generated ${recommendations.length} recommendations (engine: ${engine})`);

    return new Response(
      JSON.stringify({ recommendations, ai_powered: true, engine }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ai-recommendations] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar recomendações" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
