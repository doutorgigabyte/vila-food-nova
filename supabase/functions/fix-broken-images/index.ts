import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BROKEN_CLOUDFRONT_DOMAIN = 'd2fhl3f70zfvod.cloudfront.net';

// Curated Unsplash image collections by category
const UNSPLASH_IMAGES = {
  // Food products
  food: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    'https://images.unsplash.com/photo-1482049016gy-d331f17b0f0b?w=800&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  ],
  // Bakery
  bakery: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80',
    'https://images.unsplash.com/photo-1549931319-a545753f77b2?w=800&q=80',
    'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800&q=80',
    'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&q=80',
  ],
  // Pizza
  pizza: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80',
  ],
  // Burgers
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80',
    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80',
  ],
  // Sweets/Desserts
  sweets: [
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&q=80',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
  ],
  // Drinks
  drinks: [
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80',
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
    'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=800&q=80',
  ],
  // Grocery/Market
  grocery: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
    'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800&q=80',
  ],
  // Store logos
  logo: [
    'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=80',
    'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&q=80',
  ],
  // Store banners
  banner: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
    'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200&q=80',
  ],
  // Default fallback
  default: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80',
  ]
};

function getCategory(name: string, type: string): string {
  const nameLower = name.toLowerCase();
  
  if (type === 'establishment_logo') return 'logo';
  if (type === 'establishment_banner') return 'banner';
  
  // Food keywords
  if (nameLower.includes('pizza') || nameLower.includes('pizz')) return 'pizza';
  if (nameLower.includes('burger') || nameLower.includes('hambur') || nameLower.includes('lanche')) return 'burger';
  if (nameLower.includes('pão') || nameLower.includes('pao') || nameLower.includes('bread') || nameLower.includes('padari') || nameLower.includes('farinha') || nameLower.includes('trigo')) return 'bakery';
  if (nameLower.includes('doce') || nameLower.includes('bolo') || nameLower.includes('torta') || nameLower.includes('chocolate') || nameLower.includes('sobremesa') || nameLower.includes('brigadeiro') || nameLower.includes('pudim')) return 'sweets';
  if (nameLower.includes('suco') || nameLower.includes('refri') || nameLower.includes('água') || nameLower.includes('cerveja') || nameLower.includes('vinho') || nameLower.includes('bebida')) return 'drinks';
  if (nameLower.includes('arroz') || nameLower.includes('feijão') || nameLower.includes('oleo') || nameLower.includes('óleo') || nameLower.includes('açúcar') || nameLower.includes('sal') || nameLower.includes('mercado')) return 'grocery';
  
  return 'food'; // Default for products
}

function getRandomImage(category: string): string {
  const images = UNSPLASH_IMAGES[category as keyof typeof UNSPLASH_IMAGES] || UNSPLASH_IMAGES.default;
  return images[Math.floor(Math.random() * images.length)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, type, id, name, limit = 50 } = await req.json();

    // Action: list - Get items with broken CloudFront images
    if (action === 'list') {
      const results: any = { products: [], categories: [], logos: [], banners: [] };

      // Products with broken CloudFront URLs
      const { data: products } = await supabase
        .from('products')
        .select('id, name, image_url, establishment_id, establishments(name)')
        .ilike('image_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`)
        .limit(limit);

      results.products = (products || []).map(p => ({
        id: p.id,
        name: p.name,
        image_url: p.image_url,
        establishmentId: p.establishment_id,
        establishmentName: (p.establishments as any)?.name
      }));

      // Categories with broken CloudFront URLs
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, image_url, establishment_id, establishments(name)')
        .ilike('image_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`)
        .limit(limit);

      results.categories = (categories || []).map(c => ({
        id: c.id,
        name: c.name,
        image_url: c.image_url,
        establishmentId: c.establishment_id,
        establishmentName: (c.establishments as any)?.name
      }));

      // Establishments with broken logo URLs
      const { data: logos } = await supabase
        .from('establishments')
        .select('id, name, logo_url')
        .ilike('logo_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`)
        .limit(limit);

      results.logos = (logos || []).map(e => ({
        id: e.id,
        name: e.name,
        image_url: e.logo_url
      }));

      // Establishments with broken banner URLs
      const { data: banners } = await supabase
        .from('establishments')
        .select('id, name, banner_url')
        .ilike('banner_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`)
        .limit(limit);

      results.banners = (banners || []).map(e => ({
        id: e.id,
        name: e.name,
        image_url: e.banner_url
      }));

      // Count totals
      const { count: productCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .ilike('image_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`);

      const { count: categoryCount } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .ilike('image_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`);

      const { count: logoCount } = await supabase
        .from('establishments')
        .select('id', { count: 'exact', head: true })
        .ilike('logo_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`);

      const { count: bannerCount } = await supabase
        .from('establishments')
        .select('id', { count: 'exact', head: true })
        .ilike('banner_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`);

      return new Response(JSON.stringify({
        ...results,
        counts: {
          products: productCount || 0,
          categories: categoryCount || 0,
          logos: logoCount || 0,
          banners: bannerCount || 0,
          total: (productCount || 0) + (categoryCount || 0) + (logoCount || 0) + (bannerCount || 0)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: fix - Replace a single broken image with Unsplash
    if (action === 'fix') {
      if (!type || !id || !name) {
        throw new Error('Missing required fields: type, id, name');
      }

      const category = getCategory(name, type);
      const newImageUrl = getRandomImage(category);

      let updateResult;
      
      if (type === 'product') {
        updateResult = await supabase
          .from('products')
          .update({ image_url: newImageUrl })
          .eq('id', id);
      } else if (type === 'category') {
        updateResult = await supabase
          .from('categories')
          .update({ image_url: newImageUrl })
          .eq('id', id);
      } else if (type === 'establishment_logo') {
        updateResult = await supabase
          .from('establishments')
          .update({ logo_url: newImageUrl })
          .eq('id', id);
      } else if (type === 'establishment_banner') {
        updateResult = await supabase
          .from('establishments')
          .update({ banner_url: newImageUrl })
          .eq('id', id);
      }

      if (updateResult?.error) {
        throw updateResult.error;
      }

      console.log(`Fixed image for ${type} ${id}: ${newImageUrl}`);

      return new Response(JSON.stringify({
        success: true,
        id,
        type,
        newImageUrl,
        category
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: fix-all - Replace all broken images of a type
    if (action === 'fix-all') {
      if (!type) {
        throw new Error('Missing required field: type');
      }

      let items: any[] = [];
      let updated = 0;
      let errors = 0;

      if (type === 'product' || type === 'all') {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .ilike('image_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`);

        for (const product of products || []) {
          try {
            const category = getCategory(product.name, 'product');
            const newImageUrl = getRandomImage(category);
            await supabase.from('products').update({ image_url: newImageUrl }).eq('id', product.id);
            updated++;
          } catch (e) {
            errors++;
          }
        }
      }

      if (type === 'category' || type === 'all') {
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name')
          .ilike('image_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`);

        for (const cat of categories || []) {
          try {
            const category = getCategory(cat.name, 'category');
            const newImageUrl = getRandomImage(category);
            await supabase.from('categories').update({ image_url: newImageUrl }).eq('id', cat.id);
            updated++;
          } catch (e) {
            errors++;
          }
        }
      }

      if (type === 'establishment_logo' || type === 'all') {
        const { data: establishments } = await supabase
          .from('establishments')
          .select('id, name')
          .ilike('logo_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`);

        for (const est of establishments || []) {
          try {
            const newImageUrl = getRandomImage('logo');
            await supabase.from('establishments').update({ logo_url: newImageUrl }).eq('id', est.id);
            updated++;
          } catch (e) {
            errors++;
          }
        }
      }

      if (type === 'establishment_banner' || type === 'all') {
        const { data: establishments } = await supabase
          .from('establishments')
          .select('id, name')
          .ilike('banner_url', `%${BROKEN_CLOUDFRONT_DOMAIN}%`);

        for (const est of establishments || []) {
          try {
            const newImageUrl = getRandomImage('banner');
            await supabase.from('establishments').update({ banner_url: newImageUrl }).eq('id', est.id);
            updated++;
          } catch (e) {
            errors++;
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        type,
        updated,
        errors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action. Use: list, fix, or fix-all');

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
