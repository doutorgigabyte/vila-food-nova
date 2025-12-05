/**
 * Mercado Pago OAuth - Onboarding de Vendedores
 * 
 * Este endpoint gerencia o fluxo OAuth2 para conectar a conta MP do lojista à plataforma.
 * Após autorização, salvamos o access_token e user_id para realizar splits de pagamento.
 * 
 * SECURITY: Requires authentication and ownership verification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credenciais da aplicação MP (definidas como secrets)
const MP_CLIENT_ID = Deno.env.get('MERCADOPAGO_CLIENT_ID');
const MP_CLIENT_SECRET = Deno.env.get('MERCADOPAGO_CLIENT_SECRET');
const MP_REDIRECT_URI = Deno.env.get('MERCADOPAGO_REDIRECT_URI');

interface OAuthRequest {
  action: 'get_auth_url' | 'exchange_code' | 'refresh_token';
  establishment_id?: string;
  code?: string;
  state?: string;
}

// Helper function to verify establishment ownership
async function verifyEstablishmentOwnership(
  supabaseAdmin: any,
  userId: string,
  establishmentId: string
): Promise<{ authorized: boolean; error?: string }> {
  const { data: establishment, error } = await supabaseAdmin
    .from('establishments')
    .select('owner_id')
    .eq('id', establishmentId)
    .single();

  if (error || !establishment) {
    return { authorized: false, error: 'Estabelecimento não encontrado' };
  }

  if (establishment.owner_id === userId) {
    return { authorized: true };
  }

  // Check if user is super_admin
  const { data: userRole } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single();

  if (userRole) {
    return { authorized: true };
  }

  return { authorized: false, error: 'Você não tem permissão para gerenciar este estabelecimento' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: OAuthRequest = await req.json();
    const { action, establishment_id, code, state } = body;

    console.log('OAuth request:', { action, establishment_id, user_id: user.id });

    switch (action) {
      case 'get_auth_url': {
        if (!establishment_id) {
          throw new Error('establishment_id é obrigatório');
        }

        // SECURITY: Verify ownership
        const ownershipCheck = await verifyEstablishmentOwnership(supabaseAdmin, user.id, establishment_id);
        if (!ownershipCheck.authorized) {
          return new Response(
            JSON.stringify({ error: ownershipCheck.error, success: false }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!MP_CLIENT_ID || !MP_REDIRECT_URI) {
          throw new Error('Credenciais do Mercado Pago não configuradas');
        }

        const authUrl = new URL('https://auth.mercadopago.com.br/authorization');
        authUrl.searchParams.set('client_id', MP_CLIENT_ID);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('platform_id', 'mp');
        authUrl.searchParams.set('redirect_uri', MP_REDIRECT_URI);
        authUrl.searchParams.set('state', establishment_id);

        return new Response(JSON.stringify({
          success: true,
          auth_url: authUrl.toString(),
          message: 'Redirecione o usuário para esta URL',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'exchange_code': {
        if (!code) {
          throw new Error('code é obrigatório');
        }

        const establishmentId = state || establishment_id;
        if (!establishmentId) {
          throw new Error('establishment_id ou state é obrigatório');
        }

        // SECURITY: Verify ownership
        const ownershipCheck = await verifyEstablishmentOwnership(supabaseAdmin, user.id, establishmentId);
        if (!ownershipCheck.authorized) {
          return new Response(
            JSON.stringify({ error: ownershipCheck.error, success: false }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!MP_CLIENT_ID || !MP_CLIENT_SECRET) {
          throw new Error('Credenciais do Mercado Pago não configuradas');
        }

        const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: MP_CLIENT_ID,
            client_secret: MP_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: MP_REDIRECT_URI,
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          console.error('MP OAuth error:', error);
          throw new Error(error.message || 'Erro ao trocar código por token');
        }

        const tokenData = await tokenResponse.json();
        console.log('Token response:', { 
          user_id: tokenData.user_id, 
          expires_in: tokenData.expires_in 
        });

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

        const { error: updateError } = await supabaseAdmin
          .from('establishments')
          .update({
            mercado_pago_token: tokenData.access_token,
            mp_refresh_token: tokenData.refresh_token,
            mp_user_id: tokenData.user_id.toString(),
            mp_public_key: tokenData.public_key,
            mp_token_expires_at: expiresAt.toISOString(),
          })
          .eq('id', establishmentId);

        if (updateError) {
          console.error('Error saving tokens:', updateError);
          throw new Error('Erro ao salvar credenciais');
        }

        return new Response(JSON.stringify({
          success: true,
          user_id: tokenData.user_id,
          public_key: tokenData.public_key,
          expires_at: expiresAt.toISOString(),
          message: 'Conta Mercado Pago conectada com sucesso!',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'refresh_token': {
        if (!establishment_id) {
          throw new Error('establishment_id é obrigatório');
        }

        // SECURITY: Verify ownership
        const ownershipCheck = await verifyEstablishmentOwnership(supabaseAdmin, user.id, establishment_id);
        if (!ownershipCheck.authorized) {
          return new Response(
            JSON.stringify({ error: ownershipCheck.error, success: false }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: establishment, error: fetchError } = await supabaseAdmin
          .from('establishments')
          .select('mp_refresh_token')
          .eq('id', establishment_id)
          .single();

        if (fetchError || !establishment?.mp_refresh_token) {
          throw new Error('Refresh token não encontrado');
        }

        const refreshResponse = await fetch('https://api.mercadopago.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: MP_CLIENT_ID,
            client_secret: MP_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: establishment.mp_refresh_token,
          }),
        });

        if (!refreshResponse.ok) {
          const error = await refreshResponse.json();
          throw new Error(error.message || 'Erro ao renovar token');
        }

        const newTokenData = await refreshResponse.json();

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + newTokenData.expires_in);

        await supabaseAdmin
          .from('establishments')
          .update({
            mercado_pago_token: newTokenData.access_token,
            mp_refresh_token: newTokenData.refresh_token,
            mp_token_expires_at: expiresAt.toISOString(),
          })
          .eq('id', establishment_id);

        return new Response(JSON.stringify({
          success: true,
          expires_at: expiresAt.toISOString(),
          message: 'Token renovado com sucesso',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
