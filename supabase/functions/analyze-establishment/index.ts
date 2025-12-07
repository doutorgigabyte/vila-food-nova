import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
async function callGeminiForAnalysis(establishmentName: string, description: string | null, productNames: string[]): Promise<string[]> {
  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  
  if (!GOOGLE_API_KEY) {
    console.log("[analyze-establishment] No GOOGLE_API_KEY, skipping AI analysis");
    return [];
  }

  const systemPrompt = `Você é um consultor de marketing para restaurantes. Analise o estabelecimento e sugira melhorias.`;
  
  const userPrompt = `Estabelecimento: ${establishmentName}
Descrição atual: ${description || "Sem descrição"}
Produtos: ${productNames.slice(0, 20).join(", ")}

Sugira 3 melhorias práticas para aumentar vendas (máx 60 caracteres cada). Retorne JSON:
{"suggestions": ["sugestão 1", "sugestão 2", "sugestão 3"]}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
      }),
    });

    if (!response.ok) {
      console.log("[analyze-establishment] Gemini failed:", response.status);
      return [];
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanContent);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("[analyze-establishment] AI analysis failed:", error);
    return [];
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
    const aiSuggestions = await callGeminiForAnalysis(establishment.name, establishment.description, productNames);
    
    for (const suggestion of aiSuggestions) {
      suggestions.push({
        type: 'general',
        priority: 'medium',
        message: suggestion
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
        ai_powered: aiSuggestions.length > 0
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
