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

    // Migration actions
    if (action === 'migrate_segments') {
      // Migrate segments from legacy "segmentos" concept
      const segments = [
        { name: 'Alimentação', icon: 'utensils', is_active: true },
        { name: 'Moda', icon: 'shirt', is_active: true },
        { name: 'Pet Shop', icon: 'dog', is_active: true },
        { name: 'Eletrônicos', icon: 'smartphone', is_active: true },
        { name: 'Serviços', icon: 'wrench', is_active: true },
        { name: 'Beleza', icon: 'sparkles', is_active: true },
        { name: 'Outros', icon: 'box', is_active: true },
      ];

      const { data: result, error } = await supabaseAdmin
        .from('segments')
        .upsert(segments, { onConflict: 'name' })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_plans') {
      // Migrate plans from legacy data
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

      const { data: result, error } = await supabaseAdmin
        .from('plans')
        .upsert(plans, { onConflict: 'name' })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_states') {
      // Brazilian states
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

      const { data: result, error } = await supabaseAdmin
        .from('states')
        .upsert(states, { onConflict: 'uf' })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_establishment') {
      // Migrate a single establishment from legacy data
      const legacyEst = data;
      
      // Get segment ID
      const { data: segment } = await supabaseAdmin
        .from('segments')
        .select('id')
        .eq('name', mapLegacySegment(legacyEst.segmento))
        .single();

      // Get plan ID
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('name', 'Plano Gratuito')
        .single();

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

      const { data: result, error } = await supabaseAdmin
        .from('establishments')
        .upsert(establishment, { onConflict: 'slug' })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate_category') {
      const { establishment_id, legacy_category } = data;
      
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
      // Create admin user
      const { email, password, full_name } = data;
      
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
      // Check current data counts
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
