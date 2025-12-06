import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Projeto externo com dados em português - usando service_role para bypass RLS
const EXTERNAL_SUPABASE_URL = "https://yaiityqznznclrxqpjtm.supabase.co";
const EXTERNAL_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaWl0eXF6bnpuY2xyeHFwanRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1NzY0NCwiZXhwIjoyMDgwNDMzNjQ0fQ.Z8PVIgstF6BlAAhLEXdDb5sh73Z8ApZTa6Q2exO1VNE";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();

    // Cliente do projeto externo (origem)
    const externalClient = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_KEY);

    // Cliente do projeto atual (destino)
    const currentClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (action === "check_external") {
      // Verificar estrutura do projeto externo
      const { data: produtos, error: prodError } = await externalClient
        .from("produtos")
        .select("*")
        .limit(5);

      const { data: categorias, error: catError } = await externalClient
        .from("categorias")
        .select("*")
        .limit(5);

      const { data: estabelecimentos, error: estError } = await externalClient
        .from("estabelecimentos")
        .select("*")
        .limit(5);

      const { data: idMapping, error: mapError } = await externalClient
        .from("id_mapping")
        .select("*")
        .limit(20);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            produtos: { count: produtos?.length ?? 0, sample: produtos, error: prodError?.message },
            categorias: { count: categorias?.length ?? 0, sample: categorias, error: catError?.message },
            estabelecimentos: { count: estabelecimentos?.length ?? 0, sample: estabelecimentos, error: estError?.message },
            id_mapping: { count: idMapping?.length ?? 0, sample: idMapping, error: mapError?.message },
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_all_external_data") {
      // Buscar todos os dados do projeto externo
      const { data: produtos, error: prodError } = await externalClient
        .from("produtos")
        .select("*");

      const { data: categorias, error: catError } = await externalClient
        .from("categorias")
        .select("*");

      const { data: estabelecimentos, error: estError } = await externalClient
        .from("estabelecimentos")
        .select("*");

      const { data: idMapping, error: mapError } = await externalClient
        .from("id_mapping")
        .select("*");

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            produtos: { count: produtos?.length ?? 0, data: produtos, error: prodError?.message },
            categorias: { count: categorias?.length ?? 0, data: categorias, error: catError?.message },
            estabelecimentos: { count: estabelecimentos?.length ?? 0, data: estabelecimentos, error: estError?.message },
            id_mapping: { count: idMapping?.length ?? 0, data: idMapping, error: mapError?.message },
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "debug_mapping") {
      // Verificar estrutura do id_mapping e estabelecimentos
      const { data: idMapping } = await externalClient
        .from("id_mapping")
        .select("*");
      
      const { data: extEstabelecimentos } = await externalClient
        .from("estabelecimentos")
        .select("id, nome, slug")
        .limit(10);

      const { data: extCategorias } = await externalClient
        .from("categorias")
        .select("id, nome, rel_estabelecimentos_id, establishment_id")
        .limit(10);

      const { data: extProdutos } = await externalClient
        .from("produtos")
        .select("id, nome, rel_estabelecimentos_id, establishment_id, rel_categorias_id, category_id")
        .limit(10);

      // Verificar estabelecimentos no projeto atual
      const { data: currentEstabelecimentos } = await currentClient
        .from("establishments")
        .select("id, name, slug")
        .limit(50);

      // Agrupar id_mapping por table_name
      const mappingByTable: Record<string, any[]> = {};
      for (const m of idMapping ?? []) {
        if (!mappingByTable[m.table_name]) {
          mappingByTable[m.table_name] = [];
        }
        mappingByTable[m.table_name].push(m);
      }

      return new Response(
        JSON.stringify({
          success: true,
          debug: {
            id_mapping_total: idMapping?.length ?? 0,
            id_mapping_by_table: Object.fromEntries(
              Object.entries(mappingByTable).map(([k, v]) => [k, { count: v.length, sample: v.slice(0, 3) }])
            ),
            external_estabelecimentos: extEstabelecimentos,
            external_categorias: extCategorias,
            external_produtos: extProdutos,
            current_establishments: currentEstabelecimentos,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "migrate_by_slug") {
      // Estratégia alternativa: mapear por slug ao invés de id_mapping
      console.log("Starting migration by slug...");

      // Buscar estabelecimentos externos
      const { data: extEstabelecimentos } = await externalClient
        .from("estabelecimentos")
        .select("*");

      // Buscar estabelecimentos atuais
      const { data: currentEstablishments } = await currentClient
        .from("establishments")
        .select("id, slug");

      // Criar mapa de slug -> novo ID
      const slugToNewId = new Map(currentEstablishments?.map(e => [e.slug, e.id]) ?? []);
      
      // Criar mapa de ID externo -> novo ID (baseado no slug)
      const extIdToNewId = new Map<string, string>();
      for (const ext of extEstabelecimentos ?? []) {
        const newId = slugToNewId.get(ext.slug);
        if (newId) {
          extIdToNewId.set(String(ext.id), newId);
        }
      }

      console.log(`Mapped ${extIdToNewId.size} establishments by slug`);

      // Buscar categorias externas
      const { data: extCategorias } = await externalClient
        .from("categorias")
        .select("*");

      // Migrar categorias
      const categoryResults: any[] = [];
      const oldCatToNewCat = new Map<string, string>();

      for (const cat of extCategorias ?? []) {
        const extEstId = String(cat.rel_estabelecimentos_id ?? cat.establishment_id);
        const newEstId = extIdToNewId.get(extEstId);

        if (!newEstId) {
          categoryResults.push({ 
            id: cat.id, 
            name: cat.nome ?? cat.name, 
            status: "skipped", 
            reason: `establishment ${extEstId} not mapped`,
            extEstId
          });
          continue;
        }

        const categoryData = {
          establishment_id: newEstId,
          name: cat.nome ?? cat.name,
          description: cat.descricao ?? cat.description,
          image_url: cat.imagem ?? cat.image_url,
          sort_order: cat.ordem ?? cat.sort_order ?? 0,
          is_active: cat.ativo !== false && cat.is_active !== false,
        };

        const { data, error } = await currentClient
          .from("categories")
          .insert(categoryData)
          .select()
          .single();

        if (error) {
          categoryResults.push({ id: cat.id, name: categoryData.name, status: "error", error: error.message });
        } else {
          categoryResults.push({ id: cat.id, name: categoryData.name, status: "success", new_id: data.id });
          oldCatToNewCat.set(String(cat.id), data.id);
        }
      }

      // Buscar produtos externos
      const { data: extProdutos } = await externalClient
        .from("produtos")
        .select("*");

      // Migrar produtos
      const productResults: any[] = [];

      for (const prod of extProdutos ?? []) {
        const extEstId = String(prod.rel_estabelecimentos_id ?? prod.establishment_id);
        const newEstId = extIdToNewId.get(extEstId);

        if (!newEstId) {
          productResults.push({ 
            id: prod.id, 
            name: prod.nome ?? prod.name, 
            status: "skipped", 
            reason: `establishment ${extEstId} not mapped`
          });
          continue;
        }

        const extCatId = String(prod.rel_categorias_id ?? prod.category_id ?? "");
        const newCatId = oldCatToNewCat.get(extCatId) || null;

        const productData = {
          establishment_id: newEstId,
          category_id: newCatId,
          name: prod.nome ?? prod.name,
          description: prod.descricao ?? prod.description,
          price: parseFloat(prod.valor ?? prod.price ?? 0),
          promotional_price: prod.valor_promocional ? parseFloat(prod.valor_promocional) : null,
          image_url: prod.destaque ?? prod.image_url,
          is_active: prod.visible !== false && prod.is_active !== false,
          is_featured: prod.is_featured === true,
          stock_quantity: null,
          preparation_time: 30,
          variations: [],
          additionals: [],
        };

        const { data, error } = await currentClient
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (error) {
          productResults.push({ id: prod.id, name: productData.name, status: "error", error: error.message });
        } else {
          productResults.push({ id: prod.id, name: productData.name, status: "success", new_id: data.id });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          establishment_mappings: extIdToNewId.size,
          categories: {
            total: extCategorias?.length ?? 0,
            success: categoryResults.filter(r => r.status === "success").length,
            skipped: categoryResults.filter(r => r.status === "skipped").length,
            errors: categoryResults.filter(r => r.status === "error").length,
            results: categoryResults,
          },
          products: {
            total: extProdutos?.length ?? 0,
            success: productResults.filter(r => r.status === "success").length,
            skipped: productResults.filter(r => r.status === "skipped").length,
            errors: productResults.filter(r => r.status === "error").length,
            results: productResults,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "migrate_categories") {
      // Buscar categorias do projeto externo
      const { data: categorias, error: catError } = await externalClient
        .from("categorias")
        .select("*");

      if (catError) throw catError;

      // Buscar mapeamento de IDs de estabelecimentos - CORRIGIDO: usa "establishments" não "estabelecimentos"
      const { data: idMapping } = await externalClient
        .from("id_mapping")
        .select("*")
        .eq("table_name", "establishments");

      console.log("Found establishment mappings:", idMapping?.length);

      const estIdMap = new Map(idMapping?.map(m => [m.old_id, m.new_id]) ?? []);

      // Buscar mapeamento de categorias - CORRIGIDO: usa "categories" não "categorias"  
      const { data: catIdMapping } = await externalClient
        .from("id_mapping")
        .select("*")
        .eq("table_name", "categories");

      console.log("Found category mappings:", catIdMapping?.length);

      const catIdMap = new Map(catIdMapping?.map(m => [m.old_id, m.new_id]) ?? []);

      const results = [];
      for (const cat of categorias ?? []) {
        const newEstId = estIdMap.get(String(cat.rel_estabelecimentos_id ?? cat.establishment_id));
        const newCatId = catIdMap.get(String(cat.id));

        if (!newEstId) {
          results.push({ id: cat.id, name: cat.nome ?? cat.name, status: "skipped", reason: "no_establishment_mapping" });
          continue;
        }

        const categoryData = {
          id: newCatId || undefined,
          establishment_id: newEstId,
          name: cat.nome ?? cat.name,
          description: cat.descricao ?? cat.description,
          image_url: cat.imagem ?? cat.image_url,
          sort_order: cat.ordem ?? cat.sort_order ?? 0,
          is_active: cat.ativo !== false && cat.is_active !== false,
        };

        // Tentar inserir ou atualizar
        const { data, error } = await currentClient
          .from("categories")
          .upsert(categoryData, { onConflict: "id" })
          .select()
          .single();

        if (error) {
          results.push({ id: cat.id, name: categoryData.name, status: "error", error: error.message });
        } else {
          results.push({ id: cat.id, name: categoryData.name, status: "success", new_id: data.id });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results, total: categorias?.length ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "migrate_products") {
      // Buscar produtos do projeto externo
      const { data: produtos, error: prodError } = await externalClient
        .from("produtos")
        .select("*");

      if (prodError) throw prodError;

      // Buscar mapeamentos - CORRIGIDO: usar nomes em inglês
      const { data: estIdMapping } = await externalClient
        .from("id_mapping")
        .select("*")
        .eq("table_name", "establishments");

      const { data: catIdMapping } = await externalClient
        .from("id_mapping")
        .select("*")
        .eq("table_name", "categories");

      const { data: prodIdMapping } = await externalClient
        .from("id_mapping")
        .select("*")
        .eq("table_name", "products");

      console.log("Mappings found - establishments:", estIdMapping?.length, "categories:", catIdMapping?.length, "products:", prodIdMapping?.length);

      const estIdMap = new Map(estIdMapping?.map(m => [m.old_id, m.new_id]) ?? []);
      const catIdMap = new Map(catIdMapping?.map(m => [m.old_id, m.new_id]) ?? []);
      const prodIdMap = new Map(prodIdMapping?.map(m => [m.old_id, m.new_id]) ?? []);

      const results = [];
      for (const prod of produtos ?? []) {
        const newEstId = estIdMap.get(String(prod.rel_estabelecimentos_id ?? prod.establishment_id));
        const newCatId = catIdMap.get(String(prod.rel_categorias_id ?? prod.category_id));
        const newProdId = prodIdMap.get(String(prod.id));

        if (!newEstId) {
          results.push({ id: prod.id, name: prod.nome ?? prod.name, status: "skipped", reason: "no_establishment_mapping" });
          continue;
        }

        const productData = {
          id: newProdId || undefined,
          establishment_id: newEstId,
          category_id: newCatId || null,
          name: prod.nome ?? prod.name,
          description: prod.descricao ?? prod.description,
          price: parseFloat(prod.valor ?? prod.price ?? 0),
          promotional_price: prod.valor_promocional ? parseFloat(prod.valor_promocional) : (prod.promotional_price ? parseFloat(prod.promotional_price) : null),
          image_url: prod.destaque ?? prod.image_url,
          is_active: prod.visible !== false && prod.is_active !== false,
          is_featured: prod.is_featured === true,
          stock_quantity: prod.stock_quantity ?? null,
          preparation_time: prod.preparation_time ?? 30,
          variations: prod.variations ?? [],
          additionals: prod.additionals ?? [],
        };

        const { data, error } = await currentClient
          .from("products")
          .upsert(productData, { onConflict: "id" })
          .select()
          .single();

        if (error) {
          results.push({ id: prod.id, name: productData.name, status: "error", error: error.message });
        } else {
          results.push({ id: prod.id, name: productData.name, status: "success", new_id: data.id });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results, total: produtos?.length ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Migration error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
