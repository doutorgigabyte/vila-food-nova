import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { gatewayLLMChat, isGatewayEnabled } from "../_shared/gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Suggestion {
  type: 'description' | 'photo' | 'banner' | 'logo' | 'general';
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
  target_id?: string;
  target_name?: string;
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
    console.log("[analyze-establishment] Auth failed:", error?.message);
    return null;
  }
  
  return { userId: user.id };
}

// ==================== Ownership Verification ====================
async function verifyEstablishmentOwnership(userId: string, establishmentId: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  // Check if user owns the establishment
  const { data: establishment } = await supabase
    .from('establishments')
    .select('owner_id')
    .eq('id', establishmentId)
    .single();
    
  if (establishment?.owner_id === userId) {
    return true;
  }
  
  // Check if user has access via establishment_users
  const { data: userAccess } = await supabase
    .from('establishment_users')
    .select('id')
    .eq('user_id', userId)
    .eq('establishment_id', establishmentId)
    .eq('is_active', true)
    .single();
    
  if (userAccess) {
    return true;
  }
  
  // Check if user is super_admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single();
    
  return !!roleData;
}

// ==================== Gemini Text API Call ====================
interface AIAnalysisResult {
  suggestions: string[];
  improvedDescription?: string;
  bannerSuggestions?: string[];
  categoryOrganization?: string[];
  strategicReport?: string;
}

async function callGeminiForAnalysis(
  establishmentName: string,
  description: string | null,
  productNames: string[],
  segmentName?: string
): Promise<AIAnalysisResult> {
  const systemPrompt = `Você é um consultor de marketing especializado em cardápios digitais para restaurantes e lojas de delivery.
Seu objetivo é fornecer análises estratégicas, poéticas e inspiradoras que motivem o lojista a melhorar seu estabelecimento.
Seja específico, use números quando possível, e escreva de forma envolvente e profissional.`;

  const userPrompt = `Analise este estabelecimento e forneça recomendações estratégicas:

**Estabelecimento:** ${establishmentName}
**Segmento:** ${segmentName || 'Não especificado'}
**Descrição atual:** ${description || "Sem descrição - este é um problema crítico!"}
**Produtos (${productNames.length} itens):** ${productNames.slice(0, 25).join(", ")}

Por favor, retorne um JSON com EXATAMENTE esta estrutura:
{
  "suggestions": [
    "Sugestão prática 1 (máx 80 caracteres)",
    "Sugestão prática 2 (máx 80 caracteres)",
    "Sugestão prática 3 (máx 80 caracteres)"
  ],
  "improvedDescription": "Uma descrição otimizada e vendedora para o estabelecimento (máx 200 caracteres). Destaque o diferencial, use gatilhos emocionais, seja convidativo.",
  "bannerSuggestions": [
    "Ideia para banner 1: tema, cores e mensagem",
    "Ideia para banner 2: tema, cores e mensagem"
  ],
  "categoryOrganization": [
    "Sugestão de organização de cardápio 1",
    "Sugestão de organização de cardápio 2"
  ],
  "strategicReport": "Um parágrafo estratégico e inspirador (máx 300 caracteres) que resuma o potencial do estabelecimento e as oportunidades de crescimento. Use linguagem envolvente e motivadora."
}`;

  let content = "";
  try {
    if (isGatewayEnabled()) {
      const result = await gatewayLLMChat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        maxTokens: 1000,
      });
      if (!result.success) throw new Error(result.error || "gateway llm failed");
      content = result.data?.content ?? "";
    } else {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        console.log("[analyze-establishment] No LOVABLE_API_KEY and gateway disabled");
        return { suggestions: [] };
      }
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });
      if (!response.ok) {
        console.log("[analyze-establishment] Lovable AI failed:", response.status);
        return { suggestions: [] };
      }
      const data = await response.json();
      content = data.choices?.[0]?.message?.content || "";
    }

    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanContent);

    return {
      suggestions: parsed.suggestions || [],
      improvedDescription: parsed.improvedDescription,
      bannerSuggestions: parsed.bannerSuggestions || [],
      categoryOrganization: parsed.categoryOrganization || [],
      strategicReport: parsed.strategicReport,
    };
  } catch (error) {
    console.error("[analyze-establishment] AI analysis failed:", error);
    return { suggestions: [] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ==================== Authentication Required ====================
    const auth = await authenticateRequest(req);
    
    if (!auth) {
      console.log("[analyze-establishment] Unauthorized request rejected");
      return new Response(
        JSON.stringify({ error: "Unauthorized - authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { establishmentId } = await req.json();
    
    if (!establishmentId) {
      return new Response(
        JSON.stringify({ error: "Missing establishmentId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==================== Ownership Verification ====================
    const hasAccess = await verifyEstablishmentOwnership(auth.userId, establishmentId);
    
    if (!hasAccess) {
      console.log(`[analyze-establishment] Access denied for user ${auth.userId} to establishment ${establishmentId}`);
      return new Response(
        JSON.stringify({ error: "Access denied - you don't have permission for this establishment" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-establishment] Authenticated user ${auth.userId} analyzing establishment ${establishmentId}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch establishment
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('*')
      .eq('id', establishmentId)
      .single();

    if (estError || !establishment) {
      throw new Error("Establishment not found");
    }

    // Fetch products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, image_url, price')
      .eq('establishment_id', establishmentId)
      .eq('is_active', true);

    console.log(`[analyze-establishment] Analyzing: ${establishment.name} (${products?.length || 0} products)`);

    const suggestions: Suggestion[] = [];
    
    // ==================== Score Calculation ====================
    
    // Logo Score
    let logoScore = 0;
    if (!establishment.logo_url) {
      suggestions.push({
        type: 'logo', priority: 'high',
        message: 'Seu estabelecimento não tem logo. Uma logo profissional aumenta a confiança.',
        action: 'generate_logo', target_id: establishment.id, target_name: establishment.name
      });
    } else {
      logoScore = 80;
    }

    // Banner Score
    let bannerScore = 0;
    if (!establishment.banner_url) {
      suggestions.push({
        type: 'banner', priority: 'high',
        message: 'Adicione um banner atrativo para destacar seu estabelecimento.',
        action: 'generate_banner', target_id: establishment.id, target_name: establishment.name
      });
    } else {
      bannerScore = 80;
    }

    // Description Score
    let descriptionScore = 30;
    if (establishment.description) {
      const descLength = establishment.description.length;
      if (descLength > 100) descriptionScore = 80;
      else if (descLength > 50) descriptionScore = 60;
      else descriptionScore = 40;
    } else {
      suggestions.push({
        type: 'description', priority: 'medium',
        message: 'Adicione uma descrição atraente do seu estabelecimento.',
        action: 'improve_description', target_id: establishment.id, target_name: establishment.name
      });
    }

    // Photos Score
    let photosScore = 0;
    let productsWithoutPhoto = 0;
    
    for (const product of products || []) {
      if (!product.image_url) {
        productsWithoutPhoto++;
        if (productsWithoutPhoto <= 5) {
          suggestions.push({
            type: 'photo', priority: 'high',
            message: `"${product.name}" precisa de uma foto profissional.`,
            action: 'generate_photo', target_id: product.id, target_name: product.name
          });
        }
      }
    }

    const totalProducts = products?.length || 1;
    photosScore = Math.round(((totalProducts - productsWithoutPhoto) / totalProducts) * 100);

    if (productsWithoutPhoto > 5) {
      suggestions.push({
        type: 'photo', priority: 'high',
        message: `Mais ${productsWithoutPhoto - 5} produtos sem foto. Gere imagens para todos!`,
        action: 'generate_all_photos', target_id: establishment.id, target_name: establishment.name
      });
    }

    // ==================== AI-Powered Suggestions ====================
    const productNames = (products || []).map(p => p.name);
    
    // Get segment name for context
    let segmentName = null;
    if (establishment.segment_id) {
      const { data: segment } = await supabase
        .from('segments')
        .select('name')
        .eq('id', establishment.segment_id)
        .single();
      segmentName = segment?.name;
    }
    
    const aiAnalysis = await callGeminiForAnalysis(
      establishment.name, 
      establishment.description, 
      productNames,
      segmentName
    );
    
    // Add general suggestions
    for (const suggestion of aiAnalysis.suggestions) {
      suggestions.push({
        type: 'general',
        priority: 'medium',
        message: suggestion
      });
    }
    
    // Add description improvement suggestion if we have one
    if (aiAnalysis.improvedDescription && (!establishment.description || establishment.description.length < 50)) {
      suggestions.push({
        type: 'description',
        priority: 'high',
        message: 'Melhore sua descrição para atrair mais clientes',
        action: 'improve_description',
        target_id: establishment.id,
        target_name: aiAnalysis.improvedDescription
      });
    }
    
    // Add banner suggestions
    for (const bannerSuggestion of aiAnalysis.bannerSuggestions || []) {
      suggestions.push({
        type: 'banner',
        priority: 'medium',
        message: bannerSuggestion
      });
    }
    
    // Add category organization suggestions
    for (const orgSuggestion of aiAnalysis.categoryOrganization || []) {
      suggestions.push({
        type: 'general',
        priority: 'low',
        message: orgSuggestion
      });
    }

    // ==================== Overall Score ====================
    const overallScore = Math.round(
      (descriptionScore * 0.20) + 
      (photosScore * 0.40) + 
      (bannerScore * 0.20) + 
      (logoScore * 0.20)
    );

    // Save analysis
    await supabase.from('ai_profile_analyses').insert({
      establishment_id: establishmentId,
      overall_score: overallScore,
      description_score: descriptionScore,
      photos_score: photosScore,
      banner_score: bannerScore,
      logo_score: logoScore,
      products_analyzed: totalProducts,
      suggestions: suggestions
    });

    console.log(`[analyze-establishment] Score: ${overallScore}% | ${suggestions.length} suggestions`);

    return new Response(
      JSON.stringify({ 
        overall_score: overallScore, 
        description_score: descriptionScore, 
        photos_score: photosScore, 
        banner_score: bannerScore, 
        logo_score: logoScore, 
        products_analyzed: totalProducts, 
        products_without_photo: productsWithoutPhoto,
        suggestions: suggestions.slice(0, 15),
        ai_powered: aiAnalysis.suggestions.length > 0,
        improved_description: aiAnalysis.improvedDescription,
        strategic_report: aiAnalysis.strategicReport
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[analyze-establishment] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
