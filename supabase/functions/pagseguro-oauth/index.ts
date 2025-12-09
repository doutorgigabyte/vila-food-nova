/**
 * PagBank/PagSeguro OAuth - Onboarding de Vendedores via Connect
 * 
 * Este endpoint gerencia o fluxo OAuth2 para conectar a conta PagBank do lojista à plataforma.
 * Após autorização, salvamos o access_token e account_id para realizar splits de pagamento.
 * 
 * SECURITY: Requires authentication and ownership verification
 * 
 * Documentação: https://dev.pagbank.uol.com.br/reference/connect
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credenciais da aplicação PagBank (definidas como secrets)
const PAGSEGURO_CLIENT_ID = Deno.env.get('PAGSEGURO_CLIENT_ID');
const PAGSEGURO_PUBLIC_KEY = Deno.env.get('PAGSEGURO_PUBLIC_KEY');
const PAGSEGURO_REDIRECT_URI = Deno.env.get('PAGSEGURO_REDIRECT_URI');
const PAGSEGURO_ENVIRONMENT = Deno.env.get('PAGSEGURO_ENVIRONMENT') || 'sandbox';

// URLs baseadas no ambiente
const API_BASE_URL = PAGSEGURO_ENVIRONMENT === 'production' 
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com';

const CONNECT_BASE_URL = PAGSEGURO_ENVIRONMENT === 'production'
  ? 'https://connect.pagbank.com.br'
  : 'https://connect.sandbox.pagbank.com.br';

interface OAuthRequest {
  action: 'get_auth_url' | 'exchange_code' | 'refresh_token';
  establishment_id?: string;
  code?: string;
  state?: string;
  scope?: string;
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
    const { action, establishment_id, code, state, scope } = body;

    console.log('PagBank OAuth request:', { action, establishment_id, user_id: user.id, environment: PAGSEGURO_ENVIRONMENT });

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

        if (!PAGSEGURO_CLIENT_ID || !PAGSEGURO_REDIRECT_URI) {
          throw new Error('Credenciais do PagBank não configuradas');
        }

        // Scopes padrão para marketplace com split
        const defaultScopes = 'payments.create+payments.read+accounts.read';
        const requestedScope = scope || defaultScopes;

        // Gerar state único para segurança CSRF
        const csrfState = `${establishment_id}`;

        const authUrl = new URL(`${CONNECT_BASE_URL}/oauth2/authorize`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', PAGSEGURO_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', PAGSEGURO_REDIRECT_URI);
        authUrl.searchParams.set('scope', requestedScope);
        authUrl.searchParams.set('state', csrfState);

        return new Response(JSON.stringify({
          success: true,
          auth_url: authUrl.toString(),
          message: 'Redirecione o usuário para esta URL para autorizar',
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

        if (!PAGSEGURO_PUBLIC_KEY) {
          throw new Error('Chave pública do PagBank não configurada');
        }

        // Trocar código por token
        const tokenResponse = await fetch(`${API_BASE_URL}/oauth2/token`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Pub-Key': PAGSEGURO_PUBLIC_KEY,
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: PAGSEGURO_REDIRECT_URI,
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          console.error('PagBank OAuth error:', error);
          throw new Error(error.error_messages?.[0]?.description || 'Erro ao trocar código por token');
        }

        const tokenData = await tokenResponse.json();
        console.log('PagBank Token response:', { 
          account_id: tokenData.account_id, 
          expires_in: tokenData.expires_in,
          scope: tokenData.scope
        });

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 15552000));

        // Salvar tokens no banco
        const { error: updateError } = await supabaseAdmin
          .from('establishments')
          .update({
            pagseguro_token: tokenData.access_token,
            pagseguro_refresh_token: tokenData.refresh_token,
            pagseguro_account_id: tokenData.account_id,
            pagseguro_token_expires_at: expiresAt.toISOString(),
            pagseguro_scope: tokenData.scope,
          })
          .eq('id', establishmentId);

        if (updateError) {
          console.error('Error saving PagBank tokens:', updateError);
          throw new Error('Erro ao salvar credenciais');
        }

        return new Response(JSON.stringify({
          success: true,
          account_id: tokenData.account_id,
          scope: tokenData.scope,
          expires_at: expiresAt.toISOString(),
          message: 'Conta PagBank conectada com sucesso!',
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
          .select('pagseguro_refresh_token')
          .eq('id', establishment_id)
          .single();

        if (fetchError || !establishment?.pagseguro_refresh_token) {
          throw new Error('Refresh token do PagBank não encontrado');
        }

        const refreshResponse = await fetch(`${API_BASE_URL}/oauth2/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: establishment.pagseguro_refresh_token,
          }),
        });

        if (!refreshResponse.ok) {
          const error = await refreshResponse.json();
          throw new Error(error.error_messages?.[0]?.description || 'Erro ao renovar token');
        }

        const newTokenData = await refreshResponse.json();

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (newTokenData.expires_in || 15552000));

        await supabaseAdmin
          .from('establishments')
          .update({
            pagseguro_token: newTokenData.access_token,
            pagseguro_refresh_token: newTokenData.refresh_token,
            pagseguro_token_expires_at: expiresAt.toISOString(),
          })
          .eq('id', establishment_id);

        return new Response(JSON.stringify({
          success: true,
          expires_at: expiresAt.toISOString(),
          message: 'Token PagBank renovado com sucesso',
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
    console.error('PagBank OAuth error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
