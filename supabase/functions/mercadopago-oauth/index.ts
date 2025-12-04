/**
 * Mercado Pago OAuth - Onboarding de Vendedores
 * 
 * Este endpoint gerencia o fluxo OAuth2 para conectar a conta MP do lojista à plataforma.
 * Após autorização, salvamos o access_token e user_id para realizar splits de pagamento.
 * 
 * Fluxo:
 * 1. Lojista clica em "Conectar Mercado Pago"
 * 2. Redireciona para MP com client_id da plataforma
 * 3. Lojista autoriza
 * 4. MP redireciona de volta com code
 * 5. Trocamos code por access_token
 * 6. Salvamos credenciais no banco
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: OAuthRequest = await req.json();
    const { action, establishment_id, code, state } = body;

    console.log('OAuth request:', { action, establishment_id });

    switch (action) {
      /**
       * Gera URL de autorização para o lojista
       * O state contém o establishment_id para identificar após callback
       */
      case 'get_auth_url': {
        if (!establishment_id) {
          throw new Error('establishment_id é obrigatório');
        }

        if (!MP_CLIENT_ID || !MP_REDIRECT_URI) {
          throw new Error('Credenciais do Mercado Pago não configuradas');
        }

        // URL de autorização OAuth2 do Mercado Pago
        const authUrl = new URL('https://auth.mercadopago.com.br/authorization');
        authUrl.searchParams.set('client_id', MP_CLIENT_ID);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('platform_id', 'mp'); // Marketplace
        authUrl.searchParams.set('redirect_uri', MP_REDIRECT_URI);
        authUrl.searchParams.set('state', establishment_id); // Para identificar após callback

        return new Response(JSON.stringify({
          success: true,
          auth_url: authUrl.toString(),
          message: 'Redirecione o usuário para esta URL',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      /**
       * Troca o código de autorização por access_token
       * Este é o callback após o lojista autorizar no MP
       */
      case 'exchange_code': {
        if (!code) {
          throw new Error('code é obrigatório');
        }

        if (!MP_CLIENT_ID || !MP_CLIENT_SECRET) {
          throw new Error('Credenciais do Mercado Pago não configuradas');
        }

        // Trocar code por tokens
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

        /**
         * Resposta do MP inclui:
         * - access_token: Token para fazer requests em nome do vendedor
         * - refresh_token: Para renovar o access_token
         * - user_id: ID do vendedor no MP (usado no split)
         * - expires_in: Validade em segundos
         * - public_key: Chave pública para Checkout Pro
         */

        // Salvar tokens no estabelecimento
        const establishmentId = state || establishment_id;
        if (establishmentId) {
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

          const { error: updateError } = await supabase
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
        }

        return new Response(JSON.stringify({
          success: true,
          user_id: tokenData.user_id,
          public_key: tokenData.public_key,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          message: 'Conta Mercado Pago conectada com sucesso!',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      /**
       * Renova o access_token usando refresh_token
       * Deve ser chamado antes do token expirar
       */
      case 'refresh_token': {
        if (!establishment_id) {
          throw new Error('establishment_id é obrigatório');
        }

        // Buscar refresh_token do estabelecimento
        const { data: establishment, error: fetchError } = await supabase
          .from('establishments')
          .select('mp_refresh_token')
          .eq('id', establishment_id)
          .single();

        if (fetchError || !establishment?.mp_refresh_token) {
          throw new Error('Refresh token não encontrado');
        }

        // Renovar token
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

        // Atualizar tokens no banco
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + newTokenData.expires_in);

        await supabase
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

/**
 * PAYLOADS DE EXEMPLO:
 * 
 * 1. Obter URL de autorização:
 * POST /mercadopago-oauth
 * {
 *   "action": "get_auth_url",
 *   "establishment_id": "uuid-do-estabelecimento"
 * }
 * 
 * 2. Trocar código por token (callback):
 * POST /mercadopago-oauth
 * {
 *   "action": "exchange_code",
 *   "code": "TG-xxx",
 *   "state": "uuid-do-estabelecimento"
 * }
 * 
 * 3. Renovar token:
 * POST /mercadopago-oauth
 * {
 *   "action": "refresh_token",
 *   "establishment_id": "uuid-do-estabelecimento"
 * }
 */
