import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyCodeRequest {
  phone: string;
  code: string;
  type: 'login' | 'verification' | 'password_reset';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { phone, code, type } = await req.json() as VerifyCodeRequest;

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = phone.replace(/\D/g, '');

    // Find the code in database
    const { data: authCode, error: findError } = await supabase
      .from('auth_codes')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('code', code)
      .eq('type', type)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Error finding auth code:', findError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authCode) {
      // Check if code exists but is expired or used
      const { data: expiredCode } = await supabase
        .from('auth_codes')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('code', code)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (expiredCode?.used) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Code already used' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (expiredCode && new Date(expiredCode.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Code expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as used
    await supabase
      .from('auth_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', authCode.id);

    // Log the verification
    await supabase.from('audit_logs').insert({
      action: 'whatsapp_auth_code_verified',
      entity_type: 'auth_code',
      entity_id: authCode.id,
      metadata: { phone: formattedPhone, type },
    });

    console.log(`Auth code verified for ${formattedPhone} (${type})`);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        establishment_id: authCode.establishment_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in verify-auth-code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
