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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { establishmentId } = await req.json();
    
    if (!establishmentId) {
      return new Response(
        JSON.stringify({ error: "Missing establishmentId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('*')
      .eq('id', establishmentId)
      .single();

    if (estError || !establishment) {
      throw new Error("Establishment not found");
    }

    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, image_url, price')
      .eq('establishment_id', establishmentId)
      .eq('is_active', true);

    console.log(`Analyzing establishment: ${establishment.name}`);

    const suggestions: Suggestion[] = [];
    let descriptionScore = 50;
    let photosScore = 0;
    let bannerScore = 0;
    let logoScore = 0;

    if (!establishment.logo_url) {
      logoScore = 0;
      suggestions.push({
        type: 'logo', priority: 'high',
        message: 'Seu estabelecimento não tem logo.',
        action: 'generate_logo', target_id: establishment.id, target_name: establishment.name
      });
    } else { logoScore = 80; }

    if (!establishment.banner_url) {
      bannerScore = 0;
      suggestions.push({
        type: 'banner', priority: 'high',
        message: 'Seu estabelecimento não tem banner.',
        action: 'generate_banner', target_id: establishment.id, target_name: establishment.name
      });
    } else { bannerScore = 80; }

    let productsWithoutPhoto = 0;
    for (const product of products || []) {
      if (!product.image_url) {
        productsWithoutPhoto++;
        if (productsWithoutPhoto <= 5) {
          suggestions.push({
            type: 'photo', priority: 'high',
            message: `O produto "${product.name}" não tem foto.`,
            action: 'generate_photo', target_id: product.id, target_name: product.name
          });
        }
      }
    }

    const totalProducts = products?.length || 1;
    photosScore = Math.round(((totalProducts - productsWithoutPhoto) / totalProducts) * 100);

    const overallScore = Math.round((descriptionScore * 0.25) + (photosScore * 0.35) + (bannerScore * 0.20) + (logoScore * 0.20));

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

    return new Response(
      JSON.stringify({ overall_score: overallScore, description_score: descriptionScore, photos_score: photosScore, banner_score: bannerScore, logo_score: logoScore, products_analyzed: totalProducts, suggestions: suggestions.slice(0, 15) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});