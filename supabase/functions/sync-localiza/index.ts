import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Field mapping: VIlaFood establishments -> LocalizAI places
function mapEstablishmentToPlace(est: any) {
  return {
    name: est.name,
    slug: est.slug,
    description: est.description,
    formatted_address: [est.address, est.neighborhood]
      .filter(Boolean)
      .join(", "),
    phone: est.phone || est.whatsapp,
    latitude: est.latitude,
    longitude: est.longitude,
    image_url: est.logo_url,
    banner_url: est.banner_url,
    opening_hours: est.operating_hours,
    is_open: est.is_open,
    category: est.segment_name || "restaurant",
    vila_food_id: est.id,
    vila_food_slug: est.slug,
    vila_food_synced_at: new Date().toISOString(),
    source: "vilafood",
  };
}

// Segment ID -> LocalizAI category mapping
const SEGMENT_CATEGORY_MAP: Record<string, string> = {
  pizzaria: "pizza",
  hamburgueria: "burger",
  restaurante: "restaurant",
  lanchonete: "fast_food",
  "acai-sorvete": "ice_cream",
  padaria: "bakery",
  doceria: "dessert",
  bebidas: "drinks",
  "pet-shop": "pet_shop",
  farmacia: "pharmacy",
  mercado: "supermarket",
  eletronicos: "electronics",
  moda: "fashion",
  beleza: "beauty",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // VIlaFood Supabase client (this project)
    const vilaFoodClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // LocalizAI Supabase client (remote project)
    const localizaUrl = Deno.env.get("LOCALIZA_SUPABASE_URL");
    const localizaKey = Deno.env.get("LOCALIZA_SUPABASE_SERVICE_KEY");

    if (!localizaUrl || !localizaKey) {
      return new Response(
        JSON.stringify({
          error: "LocalizAI Supabase credentials not configured",
          hint: "Set LOCALIZA_SUPABASE_URL and LOCALIZA_SUPABASE_SERVICE_KEY in edge function secrets",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const localizaClient = createClient(localizaUrl, localizaKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { action, payload } = await req.json();
    console.log(`[sync-localiza] Action: ${action}`);

    let result;
    switch (action) {
      case "sync_establishments_to_localiza":
        result = await syncEstablishmentsToLocaliza(
          vilaFoodClient,
          localizaClient
        );
        break;

      case "sync_establishments_from_localiza":
        result = await syncEstablishmentsFromLocaliza(
          vilaFoodClient,
          localizaClient
        );
        break;

      case "webhook":
        result = await handleWebhook(vilaFoodClient, localizaClient, payload);
        break;

      case "status":
        result = await getSyncStatus(vilaFoodClient);
        break;

      case "create_mapping":
        result = await createMapping(vilaFoodClient, payload);
        break;

      case "sync_products":
        result = await syncProducts(vilaFoodClient, localizaClient, payload);
        break;

      case "sync_reviews":
        result = await syncReviews(vilaFoodClient, localizaClient, payload);
        break;

      case "sync_promotions":
        result = await syncPromotions(vilaFoodClient, localizaClient);
        break;

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown action: ${action}`,
            available_actions: [
              "sync_establishments_to_localiza",
              "sync_establishments_from_localiza",
              "webhook",
              "status",
              "create_mapping",
              "sync_products",
              "sync_reviews",
              "sync_promotions",
            ],
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[sync-localiza] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ============================================
// Action: Push VIlaFood establishments -> LocalizAI
// ============================================
async function syncEstablishmentsToLocaliza(
  vilaFood: any,
  localiza: any
) {
  const logId = crypto.randomUUID();

  // Create sync log entry
  await vilaFood.from("localiza_sync_log").insert({
    id: logId,
    sync_type: "establishments",
    direction: "to_localiza",
    status: "running",
    started_at: new Date().toISOString(),
  });

  try {
    // Fetch sync-enabled establishments
    const { data: establishments, error: fetchError } = await vilaFood
      .from("establishments")
      .select("*, segments(name, slug)")
      .eq("localiza_sync_enabled", true)
      .eq("status", "active");

    if (fetchError) throw fetchError;

    if (!establishments || establishments.length === 0) {
      await updateSyncLog(vilaFood, logId, "completed", 0, 0);
      return {
        success: true,
        message: "No sync-enabled establishments found",
        processed: 0,
      };
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const est of establishments) {
      try {
        // Map fields
        const placeData = mapEstablishmentToPlace({
          ...est,
          segment_name: est.segments?.slug
            ? SEGMENT_CATEGORY_MAP[est.segments.slug] || est.segments.name
            : "restaurant",
        });

        // Check if mapping exists
        const { data: mapping } = await vilaFood
          .from("localiza_place_mapping")
          .select("localiza_place_id")
          .eq("establishment_id", est.id)
          .single();

        if (mapping?.localiza_place_id) {
          // Update existing place in LocalizAI
          const { error: updateError } = await localiza
            .from("places")
            .update(placeData)
            .eq("id", mapping.localiza_place_id);

          if (updateError) throw updateError;
        } else {
          // Insert new place in LocalizAI
          const { data: newPlace, error: insertError } = await localiza
            .from("places")
            .insert(placeData)
            .select("id")
            .single();

          if (insertError) throw insertError;

          // Create mapping
          await vilaFood.from("localiza_place_mapping").insert({
            establishment_id: est.id,
            localiza_place_id: newPlace.id,
            sync_status: "active",
            last_synced_at: new Date().toISOString(),
          });

          // Update establishment with localiza_place_id
          await vilaFood
            .from("establishments")
            .update({
              localiza_place_id: newPlace.id,
              localiza_synced_at: new Date().toISOString(),
            })
            .eq("id", est.id);
        }

        // Update sync timestamp
        await vilaFood
          .from("establishments")
          .update({ localiza_synced_at: new Date().toISOString() })
          .eq("id", est.id);

        await vilaFood
          .from("localiza_place_mapping")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("establishment_id", est.id);

        processed++;
      } catch (err) {
        failed++;
        errors.push(`${est.name}: ${err.message}`);
        console.error(`[sync-localiza] Failed to sync ${est.name}:`, err);
      }
    }

    await updateSyncLog(vilaFood, logId, "completed", processed, failed, {
      errors,
    });

    return {
      success: true,
      processed,
      failed,
      total: establishments.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    await updateSyncLog(vilaFood, logId, "failed", 0, 0, error.message);
    throw error;
  }
}

// ============================================
// Action: Pull LocalizAI places -> VIlaFood
// Only syncs fields where LocalizAI is source-of-truth
// ============================================
async function syncEstablishmentsFromLocaliza(
  vilaFood: any,
  localiza: any
) {
  const logId = crypto.randomUUID();

  await vilaFood.from("localiza_sync_log").insert({
    id: logId,
    sync_type: "establishments",
    direction: "from_localiza",
    status: "running",
    started_at: new Date().toISOString(),
  });

  try {
    // Get all active mappings
    const { data: mappings, error: mapError } = await vilaFood
      .from("localiza_place_mapping")
      .select("establishment_id, localiza_place_id")
      .eq("sync_status", "active");

    if (mapError) throw mapError;

    if (!mappings || mappings.length === 0) {
      await updateSyncLog(vilaFood, logId, "completed", 0, 0);
      return { success: true, message: "No active mappings", processed: 0 };
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const mapping of mappings) {
      try {
        // Fetch place from LocalizAI
        const { data: place, error: placeError } = await localiza
          .from("places")
          .select("*")
          .eq("id", mapping.localiza_place_id)
          .single();

        if (placeError) throw placeError;

        // Only update fields where LocalizAI is source-of-truth:
        // google_place_id, and any LocalizAI-specific metadata
        const updateData: Record<string, any> = {
          localiza_synced_at: new Date().toISOString(),
        };

        // Pull google_place_id if available
        if (place.google_place_id) {
          await vilaFood
            .from("localiza_place_mapping")
            .update({ google_place_id: place.google_place_id })
            .eq("establishment_id", mapping.establishment_id);
        }

        await vilaFood
          .from("establishments")
          .update(updateData)
          .eq("id", mapping.establishment_id);

        await vilaFood
          .from("localiza_place_mapping")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("establishment_id", mapping.establishment_id);

        processed++;
      } catch (err) {
        failed++;
        errors.push(
          `mapping ${mapping.establishment_id}: ${err.message}`
        );
        console.error(
          `[sync-localiza] Failed to pull place ${mapping.localiza_place_id}:`,
          err
        );
      }
    }

    await updateSyncLog(vilaFood, logId, "completed", processed, failed, {
      errors,
    });

    return { success: true, processed, failed, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    await updateSyncLog(vilaFood, logId, "failed", 0, 0, error.message);
    throw error;
  }
}

// ============================================
// Action: Handle webhook from LocalizAI
// ============================================
async function handleWebhook(
  vilaFood: any,
  localiza: any,
  payload: any
) {
  if (!payload?.place_id) {
    return { error: "Missing place_id in webhook payload" };
  }

  const { place_id, event_type } = payload;

  // Find mapping for this place
  const { data: mapping } = await vilaFood
    .from("localiza_place_mapping")
    .select("establishment_id")
    .eq("localiza_place_id", place_id)
    .single();

  if (!mapping) {
    return { success: false, message: "No mapping found for place_id", place_id };
  }

  // Log the webhook event
  await vilaFood.from("localiza_sync_log").insert({
    sync_type: "establishments",
    direction: "from_localiza",
    status: "completed",
    records_processed: 1,
    details: { webhook_event: event_type, place_id },
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  // Update sync timestamp
  await vilaFood
    .from("establishments")
    .update({ localiza_synced_at: new Date().toISOString() })
    .eq("id", mapping.establishment_id);

  await vilaFood
    .from("localiza_place_mapping")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("establishment_id", mapping.establishment_id);

  return { success: true, establishment_id: mapping.establishment_id, event_type };
}

// ============================================
// Action: Get sync status
// ============================================
async function getSyncStatus(vilaFood: any) {
  const { data, error } = await vilaFood.rpc("get_localiza_sync_status");

  if (error) throw error;

  return { success: true, ...data };
}

// ============================================
// Action: Create manual mapping
// ============================================
async function createMapping(vilaFood: any, payload: any) {
  const { establishment_id, localiza_place_id, google_place_id } = payload || {};

  if (!establishment_id || !localiza_place_id) {
    return { error: "Missing establishment_id or localiza_place_id" };
  }

  const { data, error } = await vilaFood
    .from("localiza_place_mapping")
    .upsert(
      {
        establishment_id,
        localiza_place_id,
        google_place_id: google_place_id || null,
        sync_status: "active",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "establishment_id" }
    )
    .select()
    .single();

  if (error) throw error;

  // Enable sync on the establishment
  await vilaFood
    .from("establishments")
    .update({
      localiza_place_id,
      localiza_sync_enabled: true,
    })
    .eq("id", establishment_id);

  return { success: true, mapping: data };
}

// ============================================
// Action: Sync products to LocalizAI cache
// ============================================
async function syncProducts(
  vilaFood: any,
  localiza: any,
  payload?: any
) {
  const logId = crypto.randomUUID();

  await vilaFood.from("localiza_sync_log").insert({
    id: logId,
    sync_type: "products",
    direction: "to_localiza",
    status: "running",
    started_at: new Date().toISOString(),
  });

  try {
    // If a specific establishment_id is provided, sync just that one
    const filter = payload?.establishment_id
      ? { column: "id", value: payload.establishment_id }
      : null;

    let query = vilaFood
      .from("localiza_place_mapping")
      .select("establishment_id, localiza_place_id")
      .eq("sync_status", "active");

    if (filter) {
      query = query.eq("establishment_id", filter.value);
    }

    const { data: mappings, error: mapError } = await query;
    if (mapError) throw mapError;

    if (!mappings || mappings.length === 0) {
      await updateSyncLog(vilaFood, logId, "completed", 0, 0);
      return { success: true, message: "No mappings to sync", processed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const mapping of mappings) {
      try {
        // Fetch products
        const { data: products } = await vilaFood
          .from("products")
          .select("id, name, description, price, promotional_price, image_url, category_id, is_featured, is_active, preparation_time")
          .eq("establishment_id", mapping.establishment_id)
          .eq("is_active", true);

        // Fetch categories
        const { data: categories } = await vilaFood
          .from("categories")
          .select("id, name, sort_order")
          .eq("establishment_id", mapping.establishment_id);

        // Upsert into product sync cache
        await vilaFood
          .from("localiza_product_sync")
          .upsert(
            {
              establishment_id: mapping.establishment_id,
              localiza_place_id: mapping.localiza_place_id,
              products_data: products || [],
              categories_data: categories || [],
              synced_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            },
            { onConflict: "establishment_id" }
          );

        processed++;
      } catch (err) {
        failed++;
        console.error(`[sync-localiza] Failed to sync products for ${mapping.establishment_id}:`, err);
      }
    }

    await updateSyncLog(vilaFood, logId, "completed", processed, failed);
    return { success: true, processed, failed };
  } catch (error) {
    await updateSyncLog(vilaFood, logId, "failed", 0, 0, error.message);
    throw error;
  }
}

// ============================================
// Action: Sync reviews bidirectionally
// ============================================
async function syncReviews(
  vilaFood: any,
  localiza: any,
  payload?: any
) {
  const logId = crypto.randomUUID();

  await vilaFood.from("localiza_sync_log").insert({
    id: logId,
    sync_type: "reviews",
    direction: "bidirectional",
    status: "running",
    started_at: new Date().toISOString(),
  });

  try {
    const { data: mappings } = await vilaFood
      .from("localiza_place_mapping")
      .select("establishment_id, localiza_place_id")
      .eq("sync_status", "active");

    if (!mappings || mappings.length === 0) {
      await updateSyncLog(vilaFood, logId, "completed", 0, 0);
      return { success: true, message: "No mappings", processed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const mapping of mappings) {
      try {
        // Pull reviews from LocalizAI
        const { data: localizaReviews } = await localiza
          .from("reviews")
          .select("id, rating, comment, user_name, created_at")
          .eq("place_id", mapping.localiza_place_id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (localizaReviews && localizaReviews.length > 0) {
          for (const review of localizaReviews) {
            // Upsert to avoid duplicates
            await vilaFood
              .from("localiza_review_sync")
              .upsert(
                {
                  establishment_id: mapping.establishment_id,
                  localiza_place_id: mapping.localiza_place_id,
                  source: "localiza",
                  source_review_id: review.id,
                  rating: review.rating,
                  comment: review.comment,
                  reviewer_name: review.user_name,
                  synced_at: new Date().toISOString(),
                },
                { onConflict: "source,source_review_id" }
              );
          }
        }

        processed++;
      } catch (err) {
        failed++;
        console.error(`[sync-localiza] Failed to sync reviews for ${mapping.localiza_place_id}:`, err);
      }
    }

    await updateSyncLog(vilaFood, logId, "completed", processed, failed);
    return { success: true, processed, failed };
  } catch (error) {
    await updateSyncLog(vilaFood, logId, "failed", 0, 0, error.message);
    throw error;
  }
}

// ============================================
// Action: Sync promotions to LocalizAI
// ============================================
async function syncPromotions(vilaFood: any, localiza: any) {
  const logId = crypto.randomUUID();

  await vilaFood.from("localiza_sync_log").insert({
    id: logId,
    sync_type: "promotions",
    direction: "to_localiza",
    status: "running",
    started_at: new Date().toISOString(),
  });

  try {
    // Find products with active promotional prices
    const { data: promoProducts } = await vilaFood
      .from("products")
      .select("id, name, price, promotional_price, image_url, establishment_id, establishments(name, slug, localiza_place_id)")
      .not("promotional_price", "is", null)
      .eq("is_active", true)
      .gt("promotional_price", 0);

    if (!promoProducts || promoProducts.length === 0) {
      await updateSyncLog(vilaFood, logId, "completed", 0, 0);
      return { success: true, message: "No promotions found", processed: 0 };
    }

    let processed = 0;

    for (const product of promoProducts) {
      const est = product.establishments as any;
      if (!est?.localiza_place_id) continue;

      const discount = Math.round(
        ((product.price - product.promotional_price) / product.price) * 100
      );

      await vilaFood
        .from("localiza_promotion_sync")
        .upsert(
          {
            establishment_id: product.establishment_id,
            localiza_place_id: est.localiza_place_id,
            title: `${discount}% OFF - ${product.name}`,
            description: `De R$${product.price.toFixed(2)} por R$${product.promotional_price.toFixed(2)}`,
            discount_type: "percentage",
            discount_value: discount,
            image_url: product.image_url,
            is_active: true,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      processed++;
    }

    await updateSyncLog(vilaFood, logId, "completed", processed, 0);
    return { success: true, processed };
  } catch (error) {
    await updateSyncLog(vilaFood, logId, "failed", 0, 0, error.message);
    throw error;
  }
}

// ============================================
// Helper: Update sync log
// ============================================
async function updateSyncLog(
  client: any,
  logId: string,
  status: string,
  processed: number,
  failed: number,
  details?: any
) {
  await client
    .from("localiza_sync_log")
    .update({
      status,
      records_processed: processed,
      records_failed: failed,
      error_message: typeof details === "string" ? details : null,
      details: typeof details === "object" ? details : {},
      completed_at: new Date().toISOString(),
    })
    .eq("id", logId);
}
