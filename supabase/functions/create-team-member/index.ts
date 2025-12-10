import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autenticado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client for verifying the requesting user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user making the request
    const { data: { user: requestingUser }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !requestingUser) {
      throw new Error("Usuário não autenticado");
    }

    // Admin client for creating users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, name, role, establishment_id } = await req.json();

    if (!email || !name || !role || !establishment_id) {
      throw new Error("Dados incompletos. Email, nome, função e estabelecimento são obrigatórios.");
    }

    // Verify requesting user has permission (is owner/manager of the establishment)
    const { data: userEstablishment, error: permError } = await supabaseAdmin
      .from("establishment_users")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("establishment_id", establishment_id)
      .single();

    // Also check if user is super_admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requestingUser.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const isManager = userEstablishment?.role === "manager";

    if (!isSuperAdmin && !isManager) {
      throw new Error("Sem permissão para adicionar colaboradores neste estabelecimento");
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // User exists, just link to establishment
      userId = existingUser.id;
      
      // Check if already linked
      const { data: existingLink } = await supabaseAdmin
        .from("establishment_users")
        .select("id")
        .eq("user_id", userId)
        .eq("establishment_id", establishment_id)
        .single();

      if (existingLink) {
        throw new Error("Este usuário já está vinculado a este estabelecimento");
      }
    } else {
      // Create new user with invite
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          full_name: name,
        },
      });

      if (createError) {
        throw new Error(`Erro ao criar usuário: ${createError.message}`);
      }

      userId = newUser.user.id;

      // Create profile
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        full_name: name,
        role: "establishment",
      });

      // Send password reset email (acts as invite)
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
      });

      if (resetError) {
        console.error("Error sending reset email:", resetError);
      }
    }

    // Link user to establishment
    const { error: linkError } = await supabaseAdmin
      .from("establishment_users")
      .insert({
        user_id: userId,
        establishment_id,
        role,
        is_active: true,
      });

    if (linkError) {
      throw new Error(`Erro ao vincular usuário: ${linkError.message}`);
    }

    // Log the action
    await supabaseAdmin.from("audit_logs").insert({
      user_id: requestingUser.id,
      action: "create_team_member",
      entity_type: "establishment_users",
      entity_id: establishment_id,
      new_data: { email, name, role },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: existingUser 
          ? "Usuário existente vinculado ao estabelecimento"
          : "Convite enviado para o email informado",
        user_id: userId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
