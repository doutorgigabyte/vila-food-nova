import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { secret_key } = await req.json();
    
    // Simple protection - require a secret key
    if (secret_key !== 'vilafood-reset-2024') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const usersToReset = [
      { email: 'demo6@minhaveznodigital.com', name: 'Doces e Tortas' },
      { email: 'teste.beta.user@manus.im', name: 'Consumidor' }
    ];

    const results = [];
    const newPassword = 'Teste@123';

    for (const user of usersToReset) {
      // Find user by email
      const { data: userData, error: findError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (findError) {
        results.push({ email: user.email, success: false, error: findError.message });
        continue;
      }

      const foundUser = userData.users.find(u => u.email === user.email);
      
      if (!foundUser) {
        results.push({ email: user.email, success: false, error: 'User not found' });
        continue;
      }

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        foundUser.id,
        { password: newPassword }
      );

      if (updateError) {
        results.push({ email: user.email, success: false, error: updateError.message });
      } else {
        results.push({ email: user.email, name: user.name, success: true });
        console.log(`Password reset for ${user.email}`);
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Password reset complete',
      results,
      newPassword 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
