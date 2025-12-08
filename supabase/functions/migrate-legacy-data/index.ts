import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Request body text:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', JSON.stringify(requestBody));
    } catch (err: any) {
      console.error('Error parsing JSON:', err.message);
      return new Response(JSON.stringify({ 
        error: `Invalid JSON in request body: ${err.message}`,
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, data } = requestBody || {};

    console.log('Action received:', action);
    console.log('Data received:', data ? 'present' : 'missing');

    if (!action) {
      console.error('No action provided in request');
      return new Response(JSON.stringify({ 
        error: 'Action is required',
        success: false,
        received: requestBody
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_segments') {
      const segments = [
        { name: 'Alimentação', icon: 'utensils', is_active: true },
        { name: 'Moda', icon: 'shirt', is_active: true },
        { name: 'Pet Shop', icon: 'dog', is_active: true },
        { name: 'Eletrônicos', icon: 'smartphone', is_active: true },
        { name: 'Serviços', icon: 'wrench', is_active: true },
        { name: 'Beleza', icon: 'sparkles', is_active: true },
        { name: 'Outros', icon: 'box', is_active: true },
        { name: 'Supermercados', icon: 'shopping-cart', is_active: true },
        { name: 'Farmácia', icon: 'pill', is_active: true },
        { name: 'Casa e Jardim', icon: 'home', is_active: true },
      ];

      // Check existing segments first
      const { data: existing } = await supabaseAdmin
        .from('segments')
        .select('name');
      
      const existingNames = new Set((existing || []).map(s => s.name));
      const newSegments = segments.filter(s => !existingNames.has(s.name));

      if (newSegments.length > 0) {
        const { data: result, error } = await supabaseAdmin
          .from('segments')
          .insert(newSegments)
          .select();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: result, inserted: newSegments.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, data: [], message: 'All segments already exist' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_plans') {
      const plans = [
        {
          name: 'Plano Gratuito',
          description: 'Para começar a usar a plataforma',
          price: 0,
          billing_period: 'monthly',
          max_products: 10,
          max_orders: 50,
          features: ['Cardápio digital', 'QR Code', 'Pedidos via WhatsApp'],
          is_active: true
        },
        {
          name: 'Plano Mensal',
          description: 'Ideal para pequenos negócios',
          price: 49.90,
          billing_period: 'monthly',
          max_products: 100,
          max_orders: 500,
          features: ['Tudo do Gratuito', 'Banners promocionais', 'Cupons de desconto', 'Pagamentos PIX'],
          is_active: true
        },
        {
          name: 'Plano Semestral',
          description: 'Economia de 20% - Ideal para negócios em crescimento',
          price: 239.40,
          billing_period: 'semester',
          max_products: 500,
          max_orders: 2000,
          features: ['Tudo do Mensal', 'Integração Mercado Pago', 'WhatsApp AI', 'Relatórios avançados'],
          is_active: true
        },
        {
          name: 'Plano Anual',
          description: 'Economia de 30% - Para negócios estabelecidos',
          price: 419.00,
          billing_period: 'yearly',
          max_products: null,
          max_orders: null,
          features: ['Produtos ilimitados', 'Pedidos ilimitados', 'Suporte prioritário', 'Todas as funcionalidades'],
          is_active: true
        }
      ];

      // Check existing plans first
      const { data: existing } = await supabaseAdmin
        .from('plans')
        .select('name');
      
      const existingNames = new Set((existing || []).map(p => p.name));
      const newPlans = plans.filter(p => !existingNames.has(p.name));

      if (newPlans.length > 0) {
        const { data: result, error } = await supabaseAdmin
          .from('plans')
          .insert(newPlans)
          .select();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: result, inserted: newPlans.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, data: [], message: 'All plans already exist' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_states') {
      const states = [
        { name: 'Acre', uf: 'AC' },
        { name: 'Alagoas', uf: 'AL' },
        { name: 'Amapá', uf: 'AP' },
        { name: 'Amazonas', uf: 'AM' },
        { name: 'Bahia', uf: 'BA' },
        { name: 'Ceará', uf: 'CE' },
        { name: 'Distrito Federal', uf: 'DF' },
        { name: 'Espírito Santo', uf: 'ES' },
        { name: 'Goiás', uf: 'GO' },
        { name: 'Maranhão', uf: 'MA' },
        { name: 'Mato Grosso', uf: 'MT' },
        { name: 'Mato Grosso do Sul', uf: 'MS' },
        { name: 'Minas Gerais', uf: 'MG' },
        { name: 'Pará', uf: 'PA' },
        { name: 'Paraíba', uf: 'PB' },
        { name: 'Paraná', uf: 'PR' },
        { name: 'Pernambuco', uf: 'PE' },
        { name: 'Piauí', uf: 'PI' },
        { name: 'Rio de Janeiro', uf: 'RJ' },
        { name: 'Rio Grande do Norte', uf: 'RN' },
        { name: 'Rio Grande do Sul', uf: 'RS' },
        { name: 'Rondônia', uf: 'RO' },
        { name: 'Roraima', uf: 'RR' },
        { name: 'Santa Catarina', uf: 'SC' },
        { name: 'São Paulo', uf: 'SP' },
        { name: 'Sergipe', uf: 'SE' },
        { name: 'Tocantins', uf: 'TO' }
      ];

      // Check existing states first
      const { data: existing } = await supabaseAdmin
        .from('states')
        .select('uf');
      
      const existingUfs = new Set((existing || []).map(s => s.uf));
      const newStates = states.filter(s => !existingUfs.has(s.uf));

      if (newStates.length > 0) {
        const { data: result, error } = await supabaseAdmin
          .from('states')
          .insert(newStates)
          .select();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: result, inserted: newStates.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Return existing data if all states exist
      const { data: allStates } = await supabaseAdmin.from('states').select();
      return new Response(JSON.stringify({ success: true, data: allStates, message: 'All states already exist' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_establishment') {
      const legacyEst = data;
      
      // Get segment ID
      const { data: segment } = await supabaseAdmin
        .from('segments')
        .select('id')
        .eq('name', mapLegacySegment(legacyEst.segmento))
        .maybeSingle();

      // Get plan ID
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('name', 'Plano Gratuito')
        .maybeSingle();

      // Check if establishment with this slug already exists
      const { data: existingEst } = await supabaseAdmin
        .from('establishments')
        .select('id')
        .eq('slug', legacyEst.subdominio || `est-${Date.now()}`)
        .maybeSingle();

      const establishment = {
        name: legacyEst.nome || 'Estabelecimento',
        slug: legacyEst.subdominio || `est-${Date.now()}`,
        description: legacyEst.descricao || '',
        logo_url: legacyEst.perfil ? `https://legacy-images.vilafood.com.br/${legacyEst.perfil}` : null,
        banner_url: legacyEst.capa ? `https://legacy-images.vilafood.com.br/${legacyEst.capa}` : null,
        phone: legacyEst.contato_whatsapp || '',
        whatsapp: legacyEst.contato_whatsapp || '',
        email: legacyEst.email || '',
        address: legacyEst.endereco_rua || '',
        address_number: legacyEst.endereco_numero || '',
        neighborhood: legacyEst.endereco_bairro || '',
        zip_code: legacyEst.endereco_cep || '',
        segment_id: segment?.id || null,
        plan_id: plan?.id || null,
        status: legacyEst.status === '1' ? 'active' : 'pending',
        is_open: legacyEst.funcionamento === '1',
        accepts_delivery: legacyEst.delivery === '1',
        accepts_pickup: legacyEst.balcao === '1',
        accepts_table: legacyEst.mesa === '1',
        min_order_value: parseFloat(legacyEst.pedido_minimo) || 0,
        primary_color: legacyEst.cor || '#FF6B35',
        pix_key: legacyEst.chave_pix || null,
      };

      let result;
      if (existingEst) {
        // Update existing
        const { data: updated, error } = await supabaseAdmin
          .from('establishments')
          .update(establishment)
          .eq('id', existingEst.id)
          .select()
          .single();
        if (error) throw error;
        result = updated;
      } else {
        // Insert new
        const { data: inserted, error } = await supabaseAdmin
          .from('establishments')
          .insert(establishment)
          .select()
          .single();
        if (error) throw error;
        result = inserted;
      }

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_category') {
      const { establishment_id, legacy_category } = data;
      
      // Check if category already exists
      const { data: existingCat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('establishment_id', establishment_id)
        .eq('name', legacy_category.nome)
        .maybeSingle();

      if (existingCat) {
        return new Response(JSON.stringify({ success: true, data: existingCat, message: 'Category already exists' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const category = {
        establishment_id,
        name: legacy_category.nome,
        description: legacy_category.descricao || '',
        sort_order: parseInt(legacy_category.posicao) || 0,
        is_active: legacy_category.status === '1',
      };

      const { data: result, error } = await supabaseAdmin
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_product') {
      const { establishment_id, category_id, legacy_product } = data;
      
      // Check if product already exists
      const { data: existingProd } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('establishment_id', establishment_id)
        .eq('name', legacy_product.nome)
        .maybeSingle();

      if (existingProd) {
        return new Response(JSON.stringify({ success: true, data: existingProd, message: 'Product already exists' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const product = {
        establishment_id,
        category_id,
        name: legacy_product.nome,
        description: legacy_product.descricao || '',
        price: parseFloat(legacy_product.valor) || 0,
        promotional_price: legacy_product.oferta === '1' ? parseFloat(legacy_product.valor_promocional) : null,
        image_url: legacy_product.destaque ? `https://legacy-images.vilafood.com.br/${legacy_product.destaque}` : null,
        is_active: legacy_product.status === '1',
        is_featured: legacy_product.oferta === '1',
        stock_quantity: legacy_product.estoque === '1' ? 100 : null,
      };

      const { data: result, error } = await supabaseAdmin
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create_admin_user') {
      const { email, password, full_name } = data;
      
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);
      
      if (existingUser) {
        // Just ensure they have super_admin role
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('role', 'super_admin')
          .maybeSingle();

        if (!existingRole) {
          await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: existingUser.id, role: 'super_admin' });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'User already exists, role verified',
          user_id: existingUser.id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Create user in auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      });

      if (authError) throw authError;

      // Add super_admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: 'super_admin'
        });

      if (roleError) throw roleError;

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        user_id: authUser.user.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'import_products_csv') {
      console.log('Starting CSV products import');

      const csvData = data?.csvData;
      if (!csvData || !Array.isArray(csvData)) {
        return new Response(JSON.stringify({ 
          error: 'csvData deve ser um array de produtos',
          success: false 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`CSV data received: ${csvData.length} products`);

      const newImageBase = 'https://d2fhl3f70zfvod.cloudfront.net/_uploads';
      let imported = 0;
      let skipped = 0;
      let errors: string[] = [];

      // Process products in batches of 100
      const batchSize = 100;
      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        const productsToInsert = [];

        for (const row of batch) {
          try {
            // Parse image_url from JSON array format
            let imageUrl: string | null = null;
            if (row.image_url) {
              try {
                const imageArray = typeof row.image_url === 'string' 
                  ? JSON.parse(row.image_url) 
                  : row.image_url;
                if (Array.isArray(imageArray) && imageArray.length > 0) {
                  const imagePath = imageArray[0];
                  // Build full URL
                  imageUrl = `${newImageBase}/${imagePath}`;
                }
              } catch (e) {
                // If parsing fails, try to use as string directly
                if (typeof row.image_url === 'string' && row.image_url.trim()) {
                  imageUrl = row.image_url.startsWith('http') 
                    ? row.image_url 
                    : `${newImageBase}/${row.image_url}`;
                }
              }
            }

            // Check if product already exists (by id or name+establishment)
            const { data: existing } = await supabaseAdmin
              .from('products')
              .select('id')
              .eq('id', row.id)
              .maybeSingle();

            if (existing) {
              skipped++;
              continue;
            }

            const product = {
              id: row.id,
              establishment_id: row.establishment_id,
              category_id: row.category_id || null,
              name: row.name || 'Produto sem nome',
              description: row.description || null,
              price: parseFloat(row.price) || 0,
              promotional_price: row.promotional_price ? parseFloat(row.promotional_price) : null,
              image_url: imageUrl,
              is_active: row.is_active === true || row.is_active === 'true',
              is_featured: row.is_featured === true || row.is_featured === 'true',
              stock_quantity: row.stock_quantity ? parseInt(row.stock_quantity) : null,
              preparation_time: row.preparation_time ? parseInt(row.preparation_time) : 30,
              variations: row.variations || [],
              additionals: row.additionals || [],
              created_at: row.created_at || new Date().toISOString(),
              updated_at: row.updated_at || new Date().toISOString(),
            };

            productsToInsert.push(product);
          } catch (err: any) {
            errors.push(`Linha ${i + batch.indexOf(row) + 1}: ${err.message}`);
          }
        }

        if (productsToInsert.length > 0) {
          console.log(`Inserting batch ${Math.floor(i/batchSize) + 1} with ${productsToInsert.length} products`);

          const { error: insertError } = await supabaseAdmin
            .from('products')
            .insert(productsToInsert as any);

          if (insertError) {
            errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
          } else {
            imported += productsToInsert.length;
          }
        }
      }

      console.log(`CSV import completed: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);

      return new Response(JSON.stringify({
        success: true,
        imported,
        skipped,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors shown
        message: `Importados ${imported} produtos, ${skipped} já existiam`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update_cloudfront_images') {
      console.log('Starting CloudFront image URL update');

      const oldCloudFront = 'https://d2fhl3f70zfvod.cloudfront.net';
      const newImageBase = 'https://legacy-images.vilafood.com.br';
      
      let updatedCount = 0;
      const errors: string[] = [];

      // Update establishment images
      console.log('Fetching establishments with CloudFront images');

      const { data: establishments, error: estError } = await supabaseAdmin
        .from('establishments')
        .select('id, logo_url, banner_url')
        .or(`logo_url.ilike.%${oldCloudFront}%,banner_url.ilike.%${oldCloudFront}%`);

      if (estError) throw estError;

      console.log(`Found ${establishments?.length || 0} establishments with CloudFront images`);

      for (const est of establishments || []) {
        const updates: { logo_url?: string; banner_url?: string } = {};
        
        if (est.logo_url?.includes(oldCloudFront)) {
          const path = est.logo_url.replace(oldCloudFront, '').replace(/^\/+/, '');
          updates.logo_url = `${newImageBase}/${path}`;
        }
        
        if (est.banner_url?.includes(oldCloudFront)) {
          const path = est.banner_url.replace(oldCloudFront, '').replace(/^\/+/, '');
          updates.banner_url = `${newImageBase}/${path}`;
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from('establishments')
            .update(updates)
            .eq('id', est.id);

          if (updateError) {
            errors.push(`Est ${est.id}: ${updateError.message}`);
          } else {
            updatedCount++;
          }
        }
      }

      // Update product images
      console.log('Fetching products with CloudFront images');

      const { data: products, error: prodError } = await supabaseAdmin
        .from('products')
        .select('id, image_url')
        .ilike('image_url', `%${oldCloudFront}%`);

      if (prodError) throw prodError;

      console.log(`Found ${products?.length || 0} products with CloudFront images`);

      for (const prod of products || []) {
        if (prod.image_url?.includes(oldCloudFront)) {
          const path = prod.image_url.replace(oldCloudFront, '').replace(/^\/+/, '');
          const newUrl = `${newImageBase}/${path}`;

          const { error: updateError } = await supabaseAdmin
            .from('products')
            .update({ image_url: newUrl })
            .eq('id', prod.id);

          if (updateError) {
            errors.push(`Prod ${prod.id}: ${updateError.message}`);
          } else {
            updatedCount++;
          }
        }
      }

      console.log(`CloudFront image update completed: ${updatedCount} updated, ${errors.length} errors`);

      return new Response(JSON.stringify({
        success: true,
        updated: updatedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `Atualizadas ${updatedCount} URLs de imagens`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'check_duplicate_tables') {
      console.log('Starting duplicate tables check');

      // Check all duplicate table pairs
      const tablePairs = [
        { pt: 'produtos', en: 'products' },
        { pt: 'estabelecimentos', en: 'establishments' },
        { pt: 'categorias', en: 'categories' },
        { pt: 'segmentos', en: 'segments' },
        { pt: 'pedidos', en: 'orders' }
      ];

      const tableStats: any = {};

      for (const pair of tablePairs) {
        // Check Portuguese table
        try {
          const { count: countPt, error: errorPt } = await supabaseAdmin
            .from(pair.pt)
            .select('*', { count: 'exact', head: true });

          tableStats[pair.pt] = {
            exists: !errorPt,
            count: !errorPt ? (countPt || 0) : 0,
            error: errorPt?.message
          };
        } catch (err: any) {
          tableStats[pair.pt] = {
            exists: false,
            count: 0,
            error: err.message
          };
        }

        // Check English table
        try {
          const { count: countEn, error: errorEn } = await supabaseAdmin
            .from(pair.en)
            .select('*', { count: 'exact', head: true });

          tableStats[pair.en] = {
            exists: !errorEn,
            count: !errorEn ? (countEn || 0) : 0,
            error: errorEn?.message
          };
        } catch (err: any) {
          tableStats[pair.en] = {
            exists: false,
            count: 0,
            error: err.message
          };
        }
      }

      console.log('Table check completed', tableStats);

      const productsInPortuguese = tableStats.produtos?.count || 0;
      const productsInEnglish = tableStats.products?.count || 0;

      let recommendation = '';
      if (productsInPortuguese > 0 && productsInEnglish === 0) {
        recommendation = 'Produtos estão na tabela "produtos" (português). Use a função de migração para mover para "products" (inglês).';
      } else if (productsInEnglish > 0 && productsInPortuguese === 0) {
        recommendation = 'Produtos estão na tabela "products" (inglês) - correto!';
      } else if (productsInPortuguese > 0 && productsInEnglish > 0) {
        recommendation = 'ATENÇÃO: Produtos existem em AMBAS as tabelas! Há duplicação. Considere consolidar.';
      } else {
        recommendation = 'Nenhum produto encontrado nas tabelas verificadas.';
      }

      return new Response(JSON.stringify({
        success: true,
        tables: tableStats,
        productsInPortuguese,
        productsInEnglish,
        recommendation
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_products_pt_to_en') {
      console.log('Starting products migration from PT to EN');

      let migrated = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Fetch all products from Portuguese table
      console.log('Fetching products from PT table');

      const { data: produtosPt, error: fetchError } = await supabaseAdmin
        .from('produtos')
        .select('*')
        .limit(10000); // Limit to prevent timeout

      if (fetchError) {
        throw new Error(`Erro ao buscar produtos: ${fetchError.message}`);
      }

      if (!produtosPt || produtosPt.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          migrated: 0,
          skipped: 0,
          message: 'Nenhum produto encontrado na tabela "produtos"'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Products found in PT table: ${produtosPt.length}`);

      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < produtosPt.length; i += batchSize) {
        const batch = produtosPt.slice(i, i + batchSize);
        const productsToInsert = [];

        for (const produto of batch) {
          try {
            // Check if product already exists in English table
            const { data: existing } = await supabaseAdmin
              .from('products')
              .select('id')
              .eq('id', produto.id)
              .maybeSingle();

            if (existing) {
              skipped++;
              continue;
            }

            // Map Portuguese table structure to English table structure
            // Based on the schema, both tables should have similar structure
            // But we need to handle potential field name differences
            const product: any = {
              id: produto.id,
              establishment_id: produto.establishment_id || produto.estabelecimento_id,
              category_id: produto.category_id || produto.categoria_id || null,
              name: produto.name || produto.nome || 'Produto sem nome',
              description: produto.description || produto.descricao || null,
              price: parseFloat(String(produto.price || produto.preco || produto.valor || '0')),
              promotional_price: (produto.promotional_price || produto.preco_promocional || produto.valor_promocional) 
                ? parseFloat(String(produto.promotional_price || produto.preco_promocional || produto.valor_promocional)) 
                : null,
              image_url: produto.image_url || produto.imagem_url || produto.destaque || null,
              is_active: produto.is_active !== undefined 
                ? Boolean(produto.is_active) 
                : (produto.status === '1' || produto.status === 1 || produto.ativo === true || produto.ativo === 'true'),
              is_featured: produto.is_featured !== undefined 
                ? Boolean(produto.is_featured) 
                : (produto.destaque === '1' || produto.destaque === 1 || produto.em_destaque === true || produto.em_destaque === 'true'),
              stock_quantity: (produto.stock_quantity || produto.estoque) 
                ? parseInt(String(produto.stock_quantity || produto.estoque)) 
                : null,
              preparation_time: (produto.preparation_time || produto.tempo_preparo) 
                ? parseInt(String(produto.preparation_time || produto.tempo_preparo)) 
                : 30,
              variations: produto.variations || produto.variacoes || (Array.isArray(produto.variations) ? produto.variations : []),
              additionals: produto.additionals || produto.adicionais || (Array.isArray(produto.additionals) ? produto.additionals : []),
              created_at: produto.created_at || produto.criado_em || new Date().toISOString(),
              updated_at: produto.updated_at || produto.atualizado_em || new Date().toISOString(),
            };

            productsToInsert.push(product);
          } catch (err: any) {
            errors.push(`Produto ${produto.id || 'unknown'}: ${err.message}`);
          }
        }

        if (productsToInsert.length > 0) {
          console.log(`Inserting batch ${Math.floor(i/batchSize) + 1} with ${productsToInsert.length} products`);

          const { error: insertError } = await supabaseAdmin
            .from('products')
            .insert(productsToInsert as any);

          if (insertError) {
            errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
          } else {
            migrated += productsToInsert.length;
          }
        }
      }

      console.log(`Migration completed: ${migrated} migrated, ${skipped} skipped, ${errors.length} errors`);

      return new Response(JSON.stringify({
        success: true,
        migrated,
        skipped,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        message: `Migrados ${migrated} produtos de "produtos" para "products", ${skipped} já existiam`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_migration_status') {
      const [segments, plans, states, establishments, categories, products] = await Promise.all([
        supabaseAdmin.from('segments').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('plans').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('states').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('establishments').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('categories').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
      ]);

      return new Response(JSON.stringify({
        success: true,
        counts: {
          segments: segments.count || 0,
          plans: plans.count || 0,
          states: states.count || 0,
          establishments: establishments.count || 0,
          categories: categories.count || 0,
          products: products.count || 0,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.error('Unknown action:', action);
    return new Response(JSON.stringify({ 
      error: `Unknown action: ${action}`,
      success: false 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : String(error);
    console.error('Migration error:', errorMessage);
    console.error('Error stack:', errorStack);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false,
      details: errorStack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function mapLegacySegment(segmentoId: string): string {
  const mapping: Record<string, string> = {
    '1': 'Alimentação',
    '2': 'Moda',
    '3': 'Pet Shop',
    '4': 'Eletrônicos',
    '5': 'Serviços',
    '6': 'Beleza',
    '7': 'Moda',
  };
  return mapping[segmentoId] || 'Outros';
}
