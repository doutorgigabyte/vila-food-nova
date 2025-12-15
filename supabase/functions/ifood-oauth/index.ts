import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IFOOD_API_BASE = 'https://merchant-api.ifood.com.br';
const IFOOD_CLIENT_ID = Deno.env.get('IFOOD_CLIENT_ID') || '';
const IFOOD_CLIENT_SECRET = Deno.env.get('IFOOD_CLIENT_SECRET') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { action, establishmentId, authorizationCode, merchantId } = await req.json();
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

    if (action === 'generate_user_code') {
      // Step 1: Generate user code for authorization
      console.log('[iFood OAuth] Generating user code...');
      
      const params = new URLSearchParams({
        clientId: IFOOD_CLIENT_ID,
      });
      
      const response = await fetch(`${IFOOD_API_BASE}/authentication/v1.0/oauth/userCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[iFood OAuth] User code error:', errorText);
        throw new Error(`Failed to generate user code: ${response.status}`);
      }

      const data = await response.json();
      console.log('[iFood OAuth] User code generated:', data.userCode);

      // Save pending connection
      await supabase
        .from('ifood_merchant_connections')
        .upsert({
          establishment_id: establishmentId,
          status: 'pending',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'establishment_id' });

      return new Response(JSON.stringify({
        success: true,
        userCode: data.userCode,
        authorizationCodeVerifier: data.authorizationCodeVerifier,
        verificationUrl: data.verificationUrl,
        verificationUrlComplete: data.verificationUrlComplete,
        expiresIn: data.expiresIn,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'exchange_token') {
      // Step 2: Exchange authorization code for access token
      console.log('[iFood OAuth] Exchanging authorization code for token...');
      
      if (!authorizationCode) {
        throw new Error('Authorization code required');
      }

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: IFOOD_CLIENT_ID,
        client_secret: IFOOD_CLIENT_SECRET,
        authorizationCode: authorizationCode,
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
        console.error('[iFood OAuth] Token exchange error:', errorText);
        throw new Error(`Failed to exchange token: ${response.status}`);
      }

      const tokenData = await response.json();
      console.log('[iFood OAuth] Token obtained successfully');

      // Calculate token expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expiresIn || 21600));

      // Save connection with tokens (tokens are sensitive - stored as-is)
      const { error: saveError } = await supabase
        .from('ifood_merchant_connections')
        .upsert({
          establishment_id: establishmentId,
          merchant_id: merchantId || null,
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
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
        message: 'iFood connected successfully',
        expiresAt: expiresAt.toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'refresh_token') {
      // Step 3: Refresh expired token
      console.log('[iFood OAuth] Refreshing token...');

      const { data: connection, error: connError } = await supabase
        .from('ifood_merchant_connections')
        .select('refresh_token')
        .eq('establishment_id', establishmentId)
        .single();

      if (connError || !connection?.refresh_token) {
        throw new Error('No refresh token available');
      }

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: IFOOD_CLIENT_ID,
        client_secret: IFOOD_CLIENT_SECRET,
        refresh_token: connection.refresh_token,
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
        // Token might be revoked, mark connection as expired
        await supabase
          .from('ifood_merchant_connections')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('establishment_id', establishmentId);
        
        throw new Error('Failed to refresh token - please reconnect');
      }

      const tokenData = await response.json();
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expiresIn || 21600));

      await supabase
        .from('ifood_merchant_connections')
        .update({
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          token_expires_at: expiresAt.toISOString(),
          status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('establishment_id', establishmentId);

      return new Response(JSON.stringify({
        success: true,
        message: 'Token refreshed successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'disconnect') {
      // Disconnect iFood
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
        message: 'iFood disconnected',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'get_status') {
      // Get connection status
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
