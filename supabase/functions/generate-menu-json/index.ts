import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  image_url: string | null;
  category: string;
  is_available: boolean;
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

    const { establishment_id } = await req.json();

    if (!establishment_id) {
      throw new Error('establishment_id is required');
    }

    console.log('Generating menu JSON for:', establishment_id);

    // Fetch products with categories
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        promotional_price,
        image_url,
        is_active,
        category_id,
        categories(id, name, sort_order)
      `)
      .eq('establishment_id', establishment_id)
      .eq('is_active', true)
      .order('name');

    if (productsError) {
      throw productsError;
    }

    // Build menu JSON
    const menuJson: MenuItem[] = (products || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.promotional_price || product.price,
      original_price: product.price,
      image_url: product.image_url,
      category: product.categories?.name || 'Outros',
      is_available: product.is_active,
    }));

    // Group by category for AI readability
    const menuByCategory: Record<string, MenuItem[]> = {};
    menuJson.forEach(item => {
      if (!menuByCategory[item.category]) {
        menuByCategory[item.category] = [];
      }
      menuByCategory[item.category].push(item);
    });

    // Update establishment with menu JSON
    const { error: updateError } = await supabase
      .from('establishments')
      .update({
        menu_json: menuJson,
        menu_json_updated_at: new Date().toISOString(),
      })
      .eq('id', establishment_id);

    if (updateError) {
      throw updateError;
    }

    console.log('Menu JSON generated:', {
      establishment_id,
      products_count: menuJson.length,
      categories_count: Object.keys(menuByCategory).length,
    });

    return new Response(JSON.stringify({
      success: true,
      products_count: menuJson.length,
      categories: Object.keys(menuByCategory),
      menu_json: menuJson,
      menu_by_category: menuByCategory,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate Menu JSON error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});