import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthCodeRequest {
  phone: string;
  type: 'login' | 'verification' | 'password_reset';
  establishment_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!;
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { phone, type, establishment_id } = await req.json() as AuthCodeRequest;

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database
    const { error: insertError } = await supabase
      .from('auth_codes')
      .insert({
        phone: phone.replace(/\D/g, ''),
        code,
        type,
        establishment_id,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error storing auth code:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get message template based on type
    let message = '';
    switch (type) {
      case 'login':
        message = `🔐 *Código de Login VilaFood*\n\nSeu código de acesso é: *${code}*\n\nEle expira em 10 minutos.\n\n⚠️ Não compartilhe este código com ninguém.`;
        break;
      case 'verification':
        message = `✅ *Verificação VilaFood*\n\nSeu código de verificação é: *${code}*\n\nEle expira em 10 minutos.`;
        break;
      case 'password_reset':
        message = `🔑 *Redefinição de Senha VilaFood*\n\nSeu código para redefinir a senha é: *${code}*\n\nEle expira em 10 minutos.\n\n⚠️ Se você não solicitou isso, ignore esta mensagem.`;
        break;
    }

    // Send via Evolution API using system instance (Doutorgigabyte)
    const instanceName = 'Doutorgigabyte';
    const formattedPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

    const sendResponse = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: phoneWithCountry,
        text: message,
      }),
    });

    if (!sendResponse.ok) {
      const errorData = await sendResponse.text();
      console.error('Evolution API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      action: 'whatsapp_auth_code_sent',
      entity_type: 'auth_code',
      metadata: { phone: phoneWithCountry, type },
    });

    console.log(`Auth code sent to ${phoneWithCountry} for ${type}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Code sent successfully',
        expires_in: 600 // seconds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in whatsapp-auth-code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
