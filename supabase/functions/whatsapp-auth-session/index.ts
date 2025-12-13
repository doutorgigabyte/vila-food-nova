import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthSessionRequest {
  phone: string;
  code: string;
  name?: string; // Required for new users
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    const { phone, code, name } = await req.json() as AuthSessionRequest;

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phoneDigits = phone.replace(/\D/g, '');

    // Verify the code in database
    const { data: authCode, error: verifyError } = await supabase
      .from('auth_codes')
      .select('*')
      .eq('phone', phoneDigits)
      .eq('code', code)
      .eq('type', 'verification')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verifyError || !authCode) {
      console.error('Code verification failed:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as used
    await supabase
      .from('auth_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', authCode.id);

    const tempEmail = `${phoneDigits}@whatsapp.vilafood.delivery`;
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === tempEmail);

    let userId: string;
    let isNewUser = false;
    let userName = name?.trim() || '';

    if (existingUser) {
      // User exists - get their profile name
      userId = existingUser.id;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      
      userName = profile?.full_name || existingUser.user_metadata?.full_name || '';
      
      console.log(`Existing user found: ${userId}, name: ${userName}`);
    } else {
      // New user - name is required
      if (!name?.trim()) {
        return new Response(
          JSON.stringify({ 
            error: 'name_required',
            message: 'Nome é obrigatório para novos usuários',
            requires_name: true
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate random password
      const randomPassword = crypto.randomUUID() + 'Aa1!';

      // Create user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: name.trim(),
          phone: phoneDigits,
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar conta' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;
      userName = name.trim();

      // Update profile with phone
      await supabase
        .from('profiles')
        .update({ 
          phone: phoneDigits,
          full_name: name.trim(),
        })
        .eq('id', userId);

      console.log(`New user created: ${userId}`);
    }

    // Generate magic link token for the user (one-time use)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: tempEmail,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://vilafood.delivery'}/`,
      }
    });

    if (linkError) {
      console.error('Error generating magic link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar sessão' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token from the magic link
    const magicLinkUrl = new URL(linkData.properties.action_link);
    const token = magicLinkUrl.searchParams.get('token');
    const tokenType = magicLinkUrl.searchParams.get('type');

    // Log the action
    await supabase.from('audit_logs').insert({
      action: 'whatsapp_auth_session_created',
      entity_type: 'auth',
      user_id: userId,
      metadata: { phone: phoneDigits, is_new_user: isNewUser },
    });

    console.log(`Session created for user ${userId}, isNewUser: ${isNewUser}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: userId,
        name: userName,
        is_new_user: isNewUser,
        // Return the verification token for OTP verification
        token,
        token_type: tokenType,
        email: tempEmail,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in whatsapp-auth-session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
