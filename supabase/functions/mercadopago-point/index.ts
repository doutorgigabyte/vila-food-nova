import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PointRequest {
  action: 'list_devices' | 'create_order' | 'get_order_status' | 'cancel_order';
  establishment_id: string;
  amount?: number;
  description?: string;
  order_id?: string;
  external_reference?: string;
  payment_intent_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: PointRequest = await req.json();
    const { action, establishment_id, amount, description, order_id, external_reference, payment_intent_id } = body;

    console.log(`[mercadopago-point] Action: ${action}, Establishment: ${establishment_id}`);

    if (!establishment_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'establishment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch establishment with Mercado Pago credentials
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('id, name, mercado_pago_token, point_terminal_id, point_device_name')
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment) {
      console.error('[mercadopago-point] Establishment not found:', estError);
      return new Response(
        JSON.stringify({ success: false, error: 'Establishment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = establishment.mercado_pago_token;
    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mercado Pago token not configured for this establishment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const MP_API = 'https://api.mercadopago.com';

    switch (action) {
      case 'list_devices': {
        // List all Point devices for this merchant
        const response = await fetch(`${MP_API}/point/integration-api/devices`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('[mercadopago-point] Devices:', JSON.stringify(data));

        if (!response.ok) {
          return new Response(
            JSON.stringify({ success: false, error: data.message || 'Failed to list devices', details: data }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, devices: data.devices || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_order': {
        // Create a payment intent to send to the Point terminal
        if (!amount || amount <= 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'Valid amount is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const terminalId = establishment.point_terminal_id;
        if (!terminalId) {
          return new Response(
            JSON.stringify({ success: false, error: 'No Point terminal configured for this establishment' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create payment intent
        const intentPayload = {
          amount: Math.round(amount * 100), // Amount in cents
          description: description || `Pedido ${establishment.name}`,
          payment: {
            installments: 1,
            type: 'credit_card' // Can also be 'debit_card'
          },
          additional_info: {
            external_reference: external_reference || order_id || `pdv-${Date.now()}`,
            print_on_terminal: true
          }
        };

        console.log('[mercadopago-point] Creating payment intent:', JSON.stringify(intentPayload));

        // First, create a payment intent
        const intentResponse = await fetch(`${MP_API}/point/integration-api/devices/${terminalId}/payment-intents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(intentPayload)
        });

        const intentData = await intentResponse.json();
        console.log('[mercadopago-point] Payment intent response:', JSON.stringify(intentData));

        if (!intentResponse.ok) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: intentData.message || 'Failed to create payment intent',
              details: intentData 
            }),
            { status: intentResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            payment_intent_id: intentData.id,
            device_id: terminalId,
            status: intentData.state || 'OPEN',
            amount: amount
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_order_status': {
        // Get payment intent status
        if (!payment_intent_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'payment_intent_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const terminalId = establishment.point_terminal_id;
        if (!terminalId) {
          return new Response(
            JSON.stringify({ success: false, error: 'No Point terminal configured' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const statusResponse = await fetch(
          `${MP_API}/point/integration-api/payment-intents/${payment_intent_id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const statusData = await statusResponse.json();
        console.log('[mercadopago-point] Payment status:', JSON.stringify(statusData));

        if (!statusResponse.ok) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: statusData.message || 'Failed to get payment status',
              details: statusData 
            }),
            { status: statusResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Map Point states to our status
        const stateMap: Record<string, string> = {
          'OPEN': 'pending',
          'ON_TERMINAL': 'processing',
          'PROCESSING': 'processing',
          'PROCESSED': 'approved',
          'FINISHED': 'approved',
          'CANCELED': 'cancelled',
          'ERROR': 'error'
        };

        return new Response(
          JSON.stringify({ 
            success: true,
            payment_intent_id: statusData.id,
            status: stateMap[statusData.state] || statusData.state,
            state: statusData.state,
            payment_id: statusData.payment?.id,
            payment_status: statusData.payment?.status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cancel_order': {
        // Cancel a payment intent
        if (!payment_intent_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'payment_intent_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const terminalId = establishment.point_terminal_id;
        
        const cancelResponse = await fetch(
          `${MP_API}/point/integration-api/devices/${terminalId}/payment-intents/${payment_intent_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!cancelResponse.ok) {
          const cancelData = await cancelResponse.json();
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: cancelData.message || 'Failed to cancel payment intent',
              details: cancelData 
            }),
            { status: cancelResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, cancelled: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('[mercadopago-point] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
