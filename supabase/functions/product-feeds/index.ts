import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  is_active: boolean;
  establishment_id: string;
  category_id: string | null;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const establishmentSlug = url.searchParams.get('establishment');
    const format = url.searchParams.get('format') || 'facebook'; // facebook, google, instagram

    if (!establishmentSlug) {
      return new Response(JSON.stringify({ error: 'Establishment slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch establishment
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('*')
      .eq('slug', establishmentSlug)
      .eq('status', 'active')
      .single();

    if (estError || !establishment) {
      console.error('Establishment not found:', estError);
      return new Response(JSON.stringify({ error: 'Establishment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch products
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('establishment_id', establishment.id)
      .eq('is_active', true);

    if (prodError) {
      console.error('Error fetching products:', prodError);
      return new Response(JSON.stringify({ error: 'Error fetching products' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('establishment_id', establishment.id);

    const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

    const baseUrl = `${url.origin}/loja/${establishment.slug}`;
    const currency = 'BRL';

    let xmlContent = '';

    if (format === 'google') {
      // Google Merchant Center Feed
      xmlContent = generateGoogleFeed(products || [], establishment, categoryMap, baseUrl, currency);
    } else if (format === 'instagram') {
      // Instagram Shopping Feed (same as Facebook)
      xmlContent = generateFacebookFeed(products || [], establishment, categoryMap, baseUrl, currency);
    } else {
      // Facebook Catalog Feed
      xmlContent = generateFacebookFeed(products || [], establishment, categoryMap, baseUrl, currency);
    }

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error generating feed:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateFacebookFeed(
  products: Product[],
  establishment: Establishment,
  categoryMap: Map<string, string>,
  baseUrl: string,
  currency: string
): string {
  const items = products.map(product => {
    const price = product.promotional_price || product.price;
    const originalPrice = product.promotional_price ? product.price : null;
    const categoryName = product.category_id ? categoryMap.get(product.category_id) || 'Outros' : 'Outros';
    const imageUrl = product.image_url || 'https://via.placeholder.com/500x500?text=Sem+Imagem';
    const productUrl = `${baseUrl}?produto=${product.id}`;

    return `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(product.description || product.name)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:brand>${escapeXml(establishment.name)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${price.toFixed(2)} ${currency}</g:price>
      ${originalPrice ? `<g:sale_price>${price.toFixed(2)} ${currency}</g:sale_price>` : ''}
      <g:google_product_category>Food, Beverages &amp; Tobacco</g:google_product_category>
      <g:product_type>${escapeXml(categoryName)}</g:product_type>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(establishment.name)} - Catálogo</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(establishment.description || `Produtos de ${establishment.name}`)}</description>
    ${items}
  </channel>
</rss>`;
}

function generateGoogleFeed(
  products: Product[],
  establishment: Establishment,
  categoryMap: Map<string, string>,
  baseUrl: string,
  currency: string
): string {
  const items = products.map(product => {
    const price = product.promotional_price || product.price;
    const categoryName = product.category_id ? categoryMap.get(product.category_id) || 'Outros' : 'Outros';
    const imageUrl = product.image_url || 'https://via.placeholder.com/500x500?text=Sem+Imagem';
    const productUrl = `${baseUrl}?produto=${product.id}`;

    return `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <title>${escapeXml(product.name)}</title>
      <description>${escapeXml(product.description || product.name)}</description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:brand>${escapeXml(establishment.name)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${price.toFixed(2)} ${currency}</g:price>
      <g:google_product_category>422</g:google_product_category>
      <g:product_type>${escapeXml(categoryName)}</g:product_type>
      <g:identifier_exists>false</g:identifier_exists>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(establishment.name)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(establishment.description || `Produtos de ${establishment.name}`)}</description>
    ${items}
  </channel>
</rss>`;
}
