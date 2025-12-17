import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bot user-agents to detect
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'WhatsApp',
  'Twitterbot',
  'LinkedInBot',
  'Googlebot',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'Pinterest',
  'Applebot',
  'bingbot',
  'Baiduspider',
  'YandexBot',
  'DuckDuckBot',
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const userAgent = req.headers.get('user-agent');

    console.log(`[store-seo] Request for slug: ${slug}, User-Agent: ${userAgent?.substring(0, 100)}`);

    if (!slug) {
      return new Response(JSON.stringify({ error: 'slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if request is from a bot
    const botDetected = isBot(userAgent);
    console.log(`[store-seo] Bot detected: ${botDetected}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch establishment data
    const { data: establishment, error } = await supabase
      .from('establishments')
      .select('id, name, slug, description, banner_url, logo_url, meta_title, meta_description, meta_image')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !establishment) {
      console.log(`[store-seo] Establishment not found: ${slug}`);
      return new Response(JSON.stringify({ error: 'Establishment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build SEO data with fallbacks
    const seoTitle = establishment.meta_title || `${establishment.name} | VilaFood`;
    const seoDescription = establishment.meta_description || establishment.description || `Cardápio digital de ${establishment.name}. Faça seu pedido online!`;
    const seoImage = establishment.meta_image || establishment.banner_url || establishment.logo_url || 'https://vilafood.delivery/og-image.png';
    const seoUrl = `https://vilafood.delivery/loja/${establishment.slug}`;

    // If bot detected, return prerendered HTML with meta tags
    if (botDetected) {
      console.log(`[store-seo] Returning prerendered HTML for bot`);
      
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="title" content="${escapeHtml(seoTitle)}">
  <meta name="description" content="${escapeHtml(seoDescription)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${seoUrl}">
  <meta property="og:title" content="${escapeHtml(seoTitle)}">
  <meta property="og:description" content="${escapeHtml(seoDescription)}">
  <meta property="og:image" content="${seoImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="VilaFood">
  <meta property="og:locale" content="pt_BR">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${seoUrl}">
  <meta property="twitter:title" content="${escapeHtml(seoTitle)}">
  <meta property="twitter:description" content="${escapeHtml(seoDescription)}">
  <meta property="twitter:image" content="${seoImage}">
  
  <!-- WhatsApp specific -->
  <meta property="og:image:secure_url" content="${seoImage}">
  
  <!-- Canonical -->
  <link rel="canonical" href="${seoUrl}">
</head>
<body>
  <h1>${escapeHtml(establishment.name)}</h1>
  <p>${escapeHtml(seoDescription)}</p>
  <a href="${seoUrl}">Acesse o cardápio</a>
</body>
</html>`;

      return new Response(html, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    }

    // For non-bots, return JSON with SEO data (useful for debugging or API calls)
    return new Response(JSON.stringify({
      title: seoTitle,
      description: seoDescription,
      image: seoImage,
      url: seoUrl,
      establishment: {
        id: establishment.id,
        name: establishment.name,
        slug: establishment.slug,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[store-seo] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
