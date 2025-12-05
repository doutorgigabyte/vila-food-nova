import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Legacy user data from SQL
const legacyUsers = [
  { id: 1, nome: 'Administrador', email: 'admin@admin.com.br', level: '1' },
  { id: 39, nome: 'Mens Collections', email: 'demo1@demo1.com', level: '2' },
  { id: 60, nome: 'Girls Collections', email: 'demo2@minhaveznodigital.com', level: '2' },
  { id: 71, nome: 'O Pet Shop', email: 'demo4@minhaveznodigital.com', level: '2' },
  { id: 74, nome: 'Doces e Tortas', email: 'demo6@minhaveznodigital.com', level: '2' },
  { id: 121, nome: 'Casa do Bolo', email: 'teste@gmail.com', level: '2' },
  { id: 122, nome: 'Panipão Distribuidora', email: 'vitoriatoplider@gmail.com', level: '2' },
  { id: 124, nome: 'Tênis Mania', email: 'newalexdesigner2@hotmail.com', level: '2' },
  { id: 126, nome: 'Imperium Suplementos', email: 'lucaspereiratimacao1@gmail.com', level: '2' },
  { id: 127, nome: 'Distribuidora de Bebidas', email: 'newalexdesigner6@hotmail.com', level: '2' },
  { id: 132, nome: 'Ozonteck Store', email: 'investifuturo@gmail.com', level: '2' },
  { id: 135, nome: 'Açaíteria Imperium', email: 'lucaspereiratimacao2@gmail.com', level: '2' },
  { id: 136, nome: 'Pizzaria', email: 'tom@gmail.com', level: '2' },
  { id: 137, nome: 'Essencial Eletro', email: 'eletro@gmail.com', level: '2' },
  { id: 139, nome: 'JC Costa Construção', email: 'rafa@gmail.com', level: '2' },
  { id: 143, nome: 'EletroMóveis Prime', email: 'miguel@gmail.com', level: '2' },
  { id: 144, nome: 'Fragrância Suave', email: 'rosa@gmail.com', level: '2' },
  { id: 145, nome: 'Íntima Store', email: 'carla@gmail.com', level: '2' },
  { id: 148, nome: 'NatuGrão', email: 'anny@gmail.com', level: '2' },
  { id: 149, nome: 'Motorcycle', email: 'caio@gmail.com', level: '2' },
  { id: 168, nome: 'Shop Burger', email: 'burger@demo.com', level: '2' },
];

// Legacy establishment images from SQL
const legacyEstablishmentImages: Record<string, { perfil: string; capa: string }> = {
  'demo1': { perfil: 'cadastro/2020/09/1644120920jkea6ecgck.jpg', capa: 'cadastro/2020/08/1557200820gka1cehada.jpg' },
  'demo2': { perfil: '28/2020/09/0058190920dedg383f0b.jpg', capa: 'cadastro/2020/09/1222120920hic17g4ae4.jpg' },
  'demo4': { perfil: '39/2021/11/1453271121bhhke2bgkg.jpg', capa: '39/2021/11/14532711212i4e5e26cd.jpg' },
  'demo6': { perfil: '42/2021/11/1235271121gga4dc78bd.png', capa: 'cadastro/2021/11/1118271121bhjkdf49f0.png' },
  'casadobolo': { perfil: '142/2023/01/1311290123khda8ac3k8.jpg', capa: 'cadastro/2023/01/181925012377d0a5idhg.jpg' },
  'panipaodistribuidora': { perfil: '143/2023/01/16512701238jeji1ic6h.png', capa: '143/2023/01/1904270123jicc0jd7fa.png' },
  'tenis': { perfil: 'cadastro/2023/01/1404290123hjhi4gi8gi.png', capa: 'cadastro/2023/01/1404290123hae8chi99b.jpg' },
  'acaiteriaimperium': { perfil: '155/2023/03/0001280323gj6ce3g0h6.jpg', capa: '155/2023/02/15111202239dejga75bh.png' },
  'imperiumsuplementos': { perfil: '147/2023/02/1033120223kjgja3h1kb.png', capa: '147/2023/03/0119130323ek09djicjg.jpg' },
  'bebidas': { perfil: '148/2023/01/2016290123cajge86kgi.png', capa: 'cadastro/2023/01/2010290123a2cgfadejd.png' },
  'ozonteck': { perfil: '153/2023/02/1349020223kaa3e9bii0.png', capa: '153/2023/02/1349020223accbcbgfcb.png' },
  'pizzaria': { perfil: '156/2023/02/0000240223bfkh6aa0jd.jpg', capa: '156/2023/02/2359230223daa2f9hik1.jpg' },
  'essencialeletro': { perfil: '157/2023/02/1157130223h9fh4ckbi5.png', capa: '157/2023/02/115713022384efi1bd8j.jpg' },
  'massamaster': { perfil: '158/2023/03/1418050323jk1jkekgcg.png', capa: '158/2023/03/1409050323gbeg43acf3.png' },
  'eletromoveisprime': { perfil: '162/2023/02/1112190223kee79ik2ke.png', capa: '162/2023/02/2351230223k0gf1jkkb0.jpg' },
  'fragranciasuave': { perfil: '163/2023/02/114919022333jd9k96ab.png', capa: '163/2023/02/1158190223bb83j1fg8k.png' },
  'intimastore': { perfil: '164/2023/02/1453190223he6kdhid31.png', capa: '164/2023/02/2346230223ijgaj8hd95.jpeg' },
  'natugrao': { perfil: '167/2023/02/1102200223ikbgi1kag5.png', capa: '167/2023/02/1102200223aigdgjj85h.png' },
  'motorcycle': { perfil: '168/2023/02/142621022308efh6813k.png', capa: '168/2023/02/1236200223a9dhde0i8j.png' },
  'shopburger': { perfil: '192/2023/02/1014270223aa3g1ka16i.png', capa: '192/2023/02/0931270223b0a57g9b9g.png' },
};

// Slug mapping for establishments based on email
const emailToSlug: Record<string, string> = {
  'demo1@demo1.com': 'demo1',
  'demo2@minhaveznodigital.com': 'demo2',
  'demo4@minhaveznodigital.com': 'demo4',
  'demo6@minhaveznodigital.com': 'demo6',
  'teste@gmail.com': 'casadobolo',
  'vitoriatoplider@gmail.com': 'panipaodistribuidora',
  'newalexdesigner2@hotmail.com': 'tenis',
  'lucaspereiratimacao2@gmail.com': 'acaiteriaimperium',
  'lucaspereiratimacao1@gmail.com': 'imperiumsuplementos',
  'newalexdesigner6@hotmail.com': 'bebidas',
  'investifuturo@gmail.com': 'ozonteck',
  'tom@gmail.com': 'pizzaria',
  'eletro@gmail.com': 'essencialeletro',
  'rafa@gmail.com': 'massamaster',
  'miguel@gmail.com': 'eletromoveisprime',
  'rosa@gmail.com': 'fragranciasuave',
  'carla@gmail.com': 'intimastore',
  'anny@gmail.com': 'natugrao',
  'caio@gmail.com': 'motorcycle',
  'burger@demo.com': 'shopburger',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const cloudfrontUrl = Deno.env.get('AWS_CLOUDFRONT_URL') || '';
    const { action } = await req.json();

    console.log(`Action: ${action}`);

    if (action === 'create_users') {
      // Create users in Supabase Auth
      const results = [];
      
      for (const user of legacyUsers) {
        try {
          // Check if user already exists
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === user.email);
          
          if (existingUser) {
            console.log(`User ${user.email} already exists`);
            results.push({ email: user.email, status: 'already_exists', id: existingUser.id });
            continue;
          }

          // Create user in auth
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: 'vilafood2025',
            email_confirm: true,
            user_metadata: { full_name: user.nome }
          });

          if (authError) {
            console.error(`Error creating user ${user.email}:`, authError);
            results.push({ email: user.email, status: 'error', error: authError.message });
            continue;
          }

          // Add role based on level (1 = super_admin, 2 = establishment)
          if (user.level === '1') {
            await supabaseAdmin.from('user_roles').upsert({
              user_id: authUser.user.id,
              role: 'super_admin'
            }, { onConflict: 'user_id,role' });
          }

          // Add establishment role for lojistas
          if (user.level === '2') {
            await supabaseAdmin.from('user_roles').upsert({
              user_id: authUser.user.id,
              role: 'establishment'
            }, { onConflict: 'user_id,role' });
          }

          results.push({ email: user.email, status: 'created', id: authUser.user.id });
          console.log(`Created user: ${user.email}`);
        } catch (e) {
          console.error(`Exception for ${user.email}:`, e);
          results.push({ email: user.email, status: 'exception', error: String(e) });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'link_establishments') {
      // Link establishments to owners
      const results = [];
      
      // Get all users from auth
      const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
      
      for (const [email, slug] of Object.entries(emailToSlug)) {
        const authUser = allUsers?.users?.find(u => u.email === email);
        
        if (!authUser) {
          results.push({ email, slug, status: 'user_not_found' });
          continue;
        }

        // Update establishment owner_id
        const { error } = await supabaseAdmin
          .from('establishments')
          .update({ owner_id: authUser.id })
          .eq('slug', slug);

        if (error) {
          results.push({ email, slug, status: 'error', error: error.message });
        } else {
          results.push({ email, slug, status: 'linked', owner_id: authUser.id });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'sync_images') {
      // Sync images from S3/CloudFront
      const results = [];
      const baseUrl = cloudfrontUrl || 'https://s3.amazonaws.com/vilafood';

      for (const [slug, images] of Object.entries(legacyEstablishmentImages)) {
        const logoUrl = images.perfil ? `${baseUrl}/${images.perfil}` : null;
        const bannerUrl = images.capa ? `${baseUrl}/${images.capa}` : null;

        const { error } = await supabaseAdmin
          .from('establishments')
          .update({ 
            logo_url: logoUrl,
            banner_url: bannerUrl 
          })
          .eq('slug', slug);

        if (error) {
          results.push({ slug, status: 'error', error: error.message });
        } else {
          results.push({ slug, status: 'synced', logo_url: logoUrl, banner_url: bannerUrl });
        }
      }

      return new Response(JSON.stringify({ success: true, cloudfrontUrl: baseUrl, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'full_sync') {
      // Run all sync operations
      const usersResult = await fetch(req.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_users' })
      }).then(r => r.json());

      const linkResult = await fetch(req.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link_establishments' })
      }).then(r => r.json());

      const imagesResult = await fetch(req.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_images' })
      }).then(r => r.json());

      return new Response(JSON.stringify({
        success: true,
        users: usersResult,
        links: linkResult,
        images: imagesResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
