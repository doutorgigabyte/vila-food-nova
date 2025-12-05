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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { action, data } = await req.json();

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

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
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
