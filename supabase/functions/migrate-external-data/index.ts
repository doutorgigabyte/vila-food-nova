import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Projeto externo com dados legados
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

    // Verificar dados externos
    if (action === "check_external") {
      const { data: estabelecimentos } = await externalClient
        .from("estabelecimentos")
        .select("id, nome, slug")
        .order("nome");

      const { data: categorias } = await externalClient
        .from("categorias")
        .select("id, nome, rel_estabelecimentos_id");

      const { data: produtos } = await externalClient
        .from("produtos")
        .select("id, nome, rel_estabelecimentos_id, rel_categorias_id");

      const { data: currentEstablishments } = await currentClient
        .from("establishments")
        .select("id, name, slug")
        .order("name");

      // Agrupar categorias e produtos por estabelecimento
      const catByEst: Record<string, number> = {};
      const prodByEst: Record<string, number> = {};
      
      for (const cat of categorias ?? []) {
        const estId = String(cat.rel_estabelecimentos_id);
        catByEst[estId] = (catByEst[estId] || 0) + 1;
      }
      
      for (const prod of produtos ?? []) {
        const estId = String(prod.rel_estabelecimentos_id);
        prodByEst[estId] = (prodByEst[estId] || 0) + 1;
      }

      // Criar mapa de slug -> estabelecimento atual
      const currentBySlug = new Map(currentEstablishments?.map(e => [e.slug, e]) ?? []);

      // Resumo por estabelecimento
      const summary = (estabelecimentos ?? []).map(est => {
        const current = currentBySlug.get(est.slug);
        return {
          legacy_id: est.id,
          nome: est.nome,
          slug: est.slug,
          categorias: catByEst[String(est.id)] || 0,
          produtos: prodByEst[String(est.id)] || 0,
          mapeado: !!current,
          current_id: current?.id || null,
        };
      });

      return new Response(
        JSON.stringify({
          success: true,
          summary: {
            estabelecimentos_legado: estabelecimentos?.length || 0,
            estabelecimentos_atual: currentEstablishments?.length || 0,
            total_categorias: categorias?.length || 0,
            total_produtos: produtos?.length || 0,
            mapeados: summary.filter(s => s.mapeado).length,
          },
          details: summary,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Migrar tudo por slug (método principal)
    if (action === "migrate_by_slug") {
      console.log("Starting migration by slug...");

      // Buscar estabelecimentos externos
      const { data: extEstabelecimentos, error: extError } = await externalClient
        .from("estabelecimentos")
        .select("*");

      console.log(`External establishments found: ${extEstabelecimentos?.length || 0}`);
      if (extError) console.log(`External error: ${extError.message}`);

      // Buscar estabelecimentos atuais
      const { data: currentEstablishments, error: curError } = await currentClient
        .from("establishments")
        .select("id, slug");

      console.log(`Current establishments found: ${currentEstablishments?.length || 0}`);
      if (curError) console.log(`Current error: ${curError.message}`);

      // Listar slugs para debug
      const extSlugs = (extEstabelecimentos ?? []).map(e => e.slug || e.subdominio).filter(Boolean);
      const curSlugs = (currentEstablishments ?? []).map(e => e.slug).filter(Boolean);
      console.log(`External slugs: ${JSON.stringify(extSlugs.slice(0, 5))}...`);
      console.log(`Current slugs: ${JSON.stringify(curSlugs.slice(0, 5))}...`);

      // Criar mapa de slug -> novo ID
      const slugToNewId = new Map(currentEstablishments?.map(e => [e.slug, e.id]) ?? []);
      
      // Criar mapa de ID externo -> novo ID (baseado no slug ou subdominio)
      const extIdToNewId = new Map<string, string>();
      const mappedEstablishments: any[] = [];

      for (const ext of extEstabelecimentos ?? []) {
        // Tentar slug primeiro, depois subdominio
        const extSlug = ext.slug || ext.subdominio;
        const newId = slugToNewId.get(extSlug);
        if (newId) {
          extIdToNewId.set(String(ext.id), newId);
          mappedEstablishments.push({ legacy_id: ext.id, nome: ext.nome, slug: extSlug, new_id: newId });
        }
      }

      console.log(`Mapped ${extIdToNewId.size} establishments by slug`);

      // Buscar categorias externas
      const { data: extCategorias } = await externalClient
        .from("categorias")
        .select("*");

      // Buscar categorias já existentes no destino
      const { data: existingCategories } = await currentClient
        .from("categories")
        .select("id, name, establishment_id");

      const existingCatMap = new Map<string, string>();
      for (const cat of existingCategories ?? []) {
        existingCatMap.set(`${cat.establishment_id}:${cat.name}`, cat.id);
      }

      // Migrar categorias
      const categoryResults: any[] = [];
      const oldCatToNewCat = new Map<string, string>();

      for (const cat of extCategorias ?? []) {
        const extEstId = String(cat.rel_estabelecimentos_id ?? cat.establishment_id);
        const newEstId = extIdToNewId.get(extEstId);
        const catName = cat.nome ?? cat.name;

        if (!newEstId) {
          categoryResults.push({ 
            id: cat.id, 
            name: catName, 
            status: "skipped", 
            reason: `establishment ${extEstId} not mapped`,
          });
          continue;
        }

        // Verificar se categoria já existe
        const existingKey = `${newEstId}:${catName}`;
        if (existingCatMap.has(existingKey)) {
          const existingId = existingCatMap.get(existingKey)!;
          oldCatToNewCat.set(String(cat.id), existingId);
          categoryResults.push({ id: cat.id, name: catName, status: "exists", new_id: existingId });
          continue;
        }

        const categoryData = {
          establishment_id: newEstId,
          name: catName,
          description: cat.descricao ?? cat.description ?? null,
          image_url: cat.imagem ?? cat.image_url ?? null,
          sort_order: cat.ordem ?? cat.sort_order ?? 0,
          is_active: cat.ativo !== false && cat.is_active !== false,
        };

        const { data, error } = await currentClient
          .from("categories")
          .insert(categoryData)
          .select()
          .single();

        if (error) {
          categoryResults.push({ id: cat.id, name: catName, status: "error", error: error.message });
        } else {
          categoryResults.push({ id: cat.id, name: catName, status: "success", new_id: data.id });
          oldCatToNewCat.set(String(cat.id), data.id);
          existingCatMap.set(existingKey, data.id);
        }
      }

      // Buscar produtos externos
      const { data: extProdutos } = await externalClient
        .from("produtos")
        .select("*");

      // Buscar produtos já existentes
      const { data: existingProducts } = await currentClient
        .from("products")
        .select("id, name, establishment_id");

      const existingProdMap = new Map<string, string>();
      for (const prod of existingProducts ?? []) {
        existingProdMap.set(`${prod.establishment_id}:${prod.name}`, prod.id);
      }

      // Migrar produtos
      const productResults: any[] = [];

      for (const prod of extProdutos ?? []) {
        const extEstId = String(prod.rel_estabelecimentos_id ?? prod.establishment_id);
        const newEstId = extIdToNewId.get(extEstId);
        const prodName = prod.nome ?? prod.name;

        if (!newEstId) {
          productResults.push({ 
            id: prod.id, 
            name: prodName, 
            status: "skipped", 
            reason: `establishment ${extEstId} not mapped`
          });
          continue;
        }

        // Verificar se produto já existe
        const existingKey = `${newEstId}:${prodName}`;
        if (existingProdMap.has(existingKey)) {
          productResults.push({ id: prod.id, name: prodName, status: "exists" });
          continue;
        }

        const extCatId = String(prod.rel_categorias_id ?? prod.category_id ?? "");
        const newCatId = oldCatToNewCat.get(extCatId) || null;

        const productData = {
          establishment_id: newEstId,
          category_id: newCatId,
          name: prodName,
          description: prod.descricao ?? prod.description ?? null,
          price: parseFloat(prod.valor ?? prod.price ?? 0),
          promotional_price: prod.valor_promocional ? parseFloat(prod.valor_promocional) : null,
          image_url: prod.destaque ?? prod.image_url ?? null,
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
          productResults.push({ id: prod.id, name: prodName, status: "error", error: error.message });
        } else {
          productResults.push({ id: prod.id, name: prodName, status: "success", new_id: data.id });
          existingProdMap.set(existingKey, data.id);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          establishment_mappings: mappedEstablishments,
          categories: {
            total: extCategorias?.length ?? 0,
            success: categoryResults.filter(r => r.status === "success").length,
            exists: categoryResults.filter(r => r.status === "exists").length,
            skipped: categoryResults.filter(r => r.status === "skipped").length,
            errors: categoryResults.filter(r => r.status === "error").length,
            results: categoryResults,
          },
          products: {
            total: extProdutos?.length ?? 0,
            success: productResults.filter(r => r.status === "success").length,
            exists: productResults.filter(r => r.status === "exists").length,
            skipped: productResults.filter(r => r.status === "skipped").length,
            errors: productResults.filter(r => r.status === "error").length,
            results: productResults,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limpar dados do banco externo (tabelas legadas em português)
    if (action === "cleanup_external") {
      // Deletar tabelas legadas que não são mais necessárias
      const cleanup: any[] = [];

      // Contar registros antes de limpar
      const { count: catCount } = await externalClient
        .from("categorias")
        .select("*", { count: "exact", head: true });

      const { count: prodCount } = await externalClient
        .from("produtos")
        .select("*", { count: "exact", head: true });

      const { count: estCount } = await externalClient
        .from("estabelecimentos")
        .select("*", { count: "exact", head: true });

      const { count: mapCount } = await externalClient
        .from("id_mapping")
        .select("*", { count: "exact", head: true });

      cleanup.push({ table: "categorias", records: catCount });
      cleanup.push({ table: "produtos", records: prodCount });
      cleanup.push({ table: "estabelecimentos", records: estCount });
      cleanup.push({ table: "id_mapping", records: mapCount });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Use 'confirm_cleanup' para confirmar a limpeza das tabelas legadas",
          tables_to_cleanup: cleanup,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "confirm_cleanup") {
      const results: any[] = [];

      // Deletar dados das tabelas legadas
      const { error: prodError } = await externalClient
        .from("produtos")
        .delete()
        .neq("id", 0);
      results.push({ table: "produtos", deleted: !prodError, error: prodError?.message });

      const { error: catError } = await externalClient
        .from("categorias")
        .delete()
        .neq("id", 0);
      results.push({ table: "categorias", deleted: !catError, error: catError?.message });

      const { error: estError } = await externalClient
        .from("estabelecimentos")
        .delete()
        .neq("id", 0);
      results.push({ table: "estabelecimentos", deleted: !estError, error: estError?.message });

      const { error: mapError } = await externalClient
        .from("id_mapping")
        .delete()
        .neq("old_id", "0");
      results.push({ table: "id_mapping", deleted: !mapError, error: mapError?.message });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Tabelas legadas limpas",
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Ação inválida. Use: check_external, migrate_by_slug, cleanup_external, confirm_cleanup" }),
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
