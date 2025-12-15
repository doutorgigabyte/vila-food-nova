import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IFOOD_API_BASE = 'https://merchant-api.ifood.com.br';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientId = Deno.env.get('IFOOD_CLIENT_ID') || '';
    const clientSecret = Deno.env.get('IFOOD_CLIENT_SECRET') || '';

    // Get auth header for user verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, establishmentId, merchantId } = await req.json();
    console.log(`[iFood OAuth] Action: ${action}, Establishment: ${establishmentId}`);

    // Verify user owns this establishment
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('id, owner_id')
      .eq('id', establishmentId)
      .single();

    if (estError || !establishment || establishment.owner_id !== user.id) {
      throw new Error('Establishment not found or unauthorized');
    }

    if (action === 'connect') {
      // Use client_credentials flow for centralized apps
      console.log('[iFood OAuth] Connecting with client_credentials flow...');
      
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await fetch(`${IFOOD_API_BASE}/authentication/v1.0/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      const responseText = await response.text();
      console.log('[iFood OAuth] Token response:', response.status, responseText);

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Falha ao conectar com iFood (${response.status}). ${responseText}`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = JSON.parse(responseText);
      const accessToken = tokenData.accessToken || tokenData.access_token;
      const expiresIn = tokenData.expiresIn || tokenData.expires_in || 3600;

      if (!accessToken) {
        return new Response(
          JSON.stringify({ success: false, error: 'No access token received from iFood' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate token expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      // Save connection with tokens
      const { error: saveError } = await supabase
        .from('ifood_merchant_connections')
        .upsert({
          establishment_id: establishmentId,
          merchant_id: merchantId || null,
          access_token: accessToken,
          token_expires_at: expiresAt.toISOString(),
          status: 'connected',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'establishment_id' });

      if (saveError) {
        console.error('[iFood OAuth] Save error:', saveError);
        throw new Error('Failed to save connection');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'iFood conectado com sucesso',
        expiresAt: expiresAt.toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'refresh_token') {
      // For client_credentials, just get a new token
      console.log('[iFood OAuth] Refreshing token (client_credentials)...');

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await fetch(`${IFOOD_API_BASE}/authentication/v1.0/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[iFood OAuth] Refresh token error:', errorText);

        await supabase
          .from('ifood_merchant_connections')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('establishment_id', establishmentId);

        return new Response(
          JSON.stringify({
            success: false,
            error: `Falha ao renovar token do iFood (${response.status}). ${errorText}`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = await response.json();
      const accessToken = tokenData.accessToken || tokenData.access_token;
      const expiresIn = tokenData.expiresIn || tokenData.expires_in || 3600;
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      await supabase
        .from('ifood_merchant_connections')
        .update({
          access_token: accessToken,
          token_expires_at: expiresAt.toISOString(),
          status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('establishment_id', establishmentId);

      return new Response(JSON.stringify({
        success: true,
        message: 'Token renovado com sucesso',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'disconnect') {
      console.log('[iFood OAuth] Disconnecting...');
      
      await supabase
        .from('ifood_merchant_connections')
        .update({ 
          status: 'revoked', 
          access_token: null,
          refresh_token: null,
          updated_at: new Date().toISOString() 
        })
        .eq('establishment_id', establishmentId);

      return new Response(JSON.stringify({
        success: true,
        message: 'iFood desconectado',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'get_status') {
      const { data: connection } = await supabase
        .from('ifood_merchant_connections')
        .select('status, merchant_id, last_sync_at, token_expires_at')
        .eq('establishment_id', establishmentId)
        .single();

      return new Response(JSON.stringify({
        success: true,
        connected: connection?.status === 'connected',
        status: connection?.status || 'not_connected',
        merchantId: connection?.merchant_id,
        lastSyncAt: connection?.last_sync_at,
        tokenExpiresAt: connection?.token_expires_at,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: any) {
    console.error('[iFood OAuth] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Internal server error',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
