import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IFOOD_API_BASE = 'https://merchant-api.ifood.com.br';

interface IFoodCategory {
  id: string;
  name: string;
  description?: string;
  order?: number;
}

interface IFoodItem {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price?: { value: number; originalValue?: number };
  imagePath?: string;
  status?: string;
  categoryId?: string;
  optionGroups?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header for user verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { establishmentId, merchantId } = await req.json();
    console.log(`[iFood Import] Starting import for establishment: ${establishmentId}`);

    // Verify user owns this establishment
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('id, owner_id, name')
      .eq('id', establishmentId)
      .single();

    if (estError || !establishment || establishment.owner_id !== user.id) {
      throw new Error('Establishment not found or unauthorized');
    }

    // Get iFood connection and access token
    const { data: connection, error: connError } = await supabase
      .from('ifood_merchant_connections')
      .select('access_token, merchant_id, status, token_expires_at')
      .eq('establishment_id', establishmentId)
      .single();

    if (connError || !connection || connection.status !== 'connected') {
      throw new Error('iFood not connected. Please connect first.');
    }

    // Check if token is expired
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      throw new Error('Token expired. Please refresh your connection.');
    }

    const accessToken = connection.access_token;
    const ifoodMerchantId = merchantId || connection.merchant_id;

    if (!ifoodMerchantId) {
      throw new Error('Merchant ID not provided');
    }

    // Save merchant_id if not already saved
    if (!connection.merchant_id) {
      await supabase
        .from('ifood_merchant_connections')
        .update({ merchant_id: ifoodMerchantId })
        .eq('establishment_id', establishmentId);
    }

    const stats = {
      categoriesImported: 0,
      categoriesUpdated: 0,
      productsImported: 0,
      productsUpdated: 0,
      errors: [] as string[],
    };

    // Step 1: Fetch categories from iFood
    console.log('[iFood Import] Fetching categories...');
    let categories: IFoodCategory[] = [];
    
    try {
      const catResponse = await fetch(
        `${IFOOD_API_BASE}/catalog/v2.0/merchants/${ifoodMerchantId}/categories`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (catResponse.ok) {
        categories = await catResponse.json();
        console.log(`[iFood Import] Found ${categories.length} categories`);
      } else {
        const errorText = await catResponse.text();
        console.error('[iFood Import] Categories error:', errorText);
        stats.errors.push(`Failed to fetch categories: ${catResponse.status}`);
      }
    } catch (err: any) {
      console.error('[iFood Import] Categories fetch error:', err);
      stats.errors.push(`Categories fetch error: ${err?.message || 'Unknown error'}`);
    }

    // Create a map of iFood category ID to our category ID
    const categoryMap: Record<string, string> = {};

    // Step 2: Import/Update categories
    for (const cat of categories) {
      try {
        // Check if category exists by ifood_category_id
        const { data: existingCat } = await supabase
          .from('categories')
          .select('id')
          .eq('establishment_id', establishmentId)
          .eq('ifood_category_id', cat.id)
          .single();

        if (existingCat) {
          // Update existing
          await supabase
            .from('categories')
            .update({
              name: cat.name,
              description: cat.description || null,
              sort_order: cat.order || 0,
            })
            .eq('id', existingCat.id);
          
          categoryMap[cat.id] = existingCat.id;
          stats.categoriesUpdated++;
        } else {
          // Create new
          const { data: newCat, error: catErr } = await supabase
            .from('categories')
            .insert({
              establishment_id: establishmentId,
              name: cat.name,
              description: cat.description || null,
              sort_order: cat.order || 0,
              ifood_category_id: cat.id,
              is_active: true,
            })
            .select('id')
            .single();

          if (newCat) {
            categoryMap[cat.id] = newCat.id;
            stats.categoriesImported++;
          } else if (catErr) {
            stats.errors.push(`Failed to create category ${cat.name}: ${catErr.message}`);
          }
        }
      } catch (err: any) {
        stats.errors.push(`Category ${cat.name} error: ${err?.message || 'Unknown error'}`);
      }
    }

    console.log(`[iFood Import] Categories done: ${stats.categoriesImported} new, ${stats.categoriesUpdated} updated`);

    // Step 3: Fetch and import items
    console.log('[iFood Import] Fetching items...');
    
    try {
      const itemsResponse = await fetch(
        `${IFOOD_API_BASE}/catalog/v2.0/merchants/${ifoodMerchantId}/items`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (itemsResponse.ok) {
        const items: IFoodItem[] = await itemsResponse.json();
        console.log(`[iFood Import] Found ${items.length} items`);

        for (const item of items) {
          try {
            // Convert price from centavos to reais
            const priceInReais = item.price?.value ? item.price.value / 100 : 0;
            const originalPriceInReais = item.price?.originalValue ? item.price.originalValue / 100 : null;

            // Check if product exists by ifood_item_id
            const { data: existingProduct } = await supabase
              .from('products')
              .select('id')
              .eq('establishment_id', establishmentId)
              .eq('ifood_item_id', item.id)
              .single();

            const productData = {
              name: item.name,
              description: item.description || null,
              price: originalPriceInReais || priceInReais,
              promotional_price: originalPriceInReais ? priceInReais : null,
              image_url: item.imagePath || null,
              ifood_item_id: item.id,
              ifood_sku: item.sku || null,
              ifood_last_sync: new Date().toISOString(),
              is_active: item.status !== 'UNAVAILABLE',
              category_id: item.categoryId ? categoryMap[item.categoryId] || null : null,
              additionals: item.optionGroups ? JSON.stringify(item.optionGroups) : null,
            };

            if (existingProduct) {
              // Update existing
              await supabase
                .from('products')
                .update(productData)
                .eq('id', existingProduct.id);
              
              stats.productsUpdated++;
            } else {
              // Create new
              const { error: prodErr } = await supabase
                .from('products')
                .insert({
                  establishment_id: establishmentId,
                  ...productData,
                });

              if (prodErr) {
                stats.errors.push(`Failed to create product ${item.name}: ${prodErr.message}`);
              } else {
                stats.productsImported++;
              }
            }
          } catch (err: any) {
            stats.errors.push(`Product ${item.name} error: ${err?.message || 'Unknown error'}`);
          }
        }
      } else {
        const errorText = await itemsResponse.text();
        console.error('[iFood Import] Items error:', errorText);
        stats.errors.push(`Failed to fetch items: ${itemsResponse.status}`);
      }
    } catch (err: any) {
      console.error('[iFood Import] Items fetch error:', err);
      stats.errors.push(`Items fetch error: ${err?.message || 'Unknown error'}`);
    }

    console.log(`[iFood Import] Products done: ${stats.productsImported} new, ${stats.productsUpdated} updated`);

    // Update last sync timestamp
    await supabase
      .from('ifood_merchant_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('establishment_id', establishmentId);

    const totalItems = stats.categoriesImported + stats.categoriesUpdated + 
                       stats.productsImported + stats.productsUpdated;

    return new Response(JSON.stringify({
      success: true,
      message: `Importação concluída! ${totalItems} itens processados.`,
      stats,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[iFood Import] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Internal server error',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
