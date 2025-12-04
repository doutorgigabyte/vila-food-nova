import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  phone: string;
  message: string;
  type: 'affiliate_payout' | 'order_status' | 'payment_received' | 'general';
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('Evolution API credentials not configured');
      throw new Error('Evolution API credentials not configured');
    }

    const { phone, message, type, metadata } = await req.json() as NotificationRequest;

    if (!phone || !message) {
      throw new Error('Phone and message are required');
    }

    // Format phone number (remove non-digits and ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    console.log(`Sending ${type} notification to ${formattedPhone}`);

    // Send message via Evolution API
    const response = await fetch(`${evolutionApiUrl}/message/sendText/vilafood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      throw new Error(`Failed to send WhatsApp message: ${errorText}`);
    }

    const result = await response.json();
    console.log('Message sent successfully:', result);

    // Log notification in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('whatsapp_analytics').insert({
      establishment_id: metadata?.establishment_id || '00000000-0000-0000-0000-000000000000',
      event_type: `notification_${type}`,
      event_data: {
        phone: formattedPhone,
        message_preview: message.substring(0, 100),
        metadata,
        sent_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ success: true, message_id: result?.key?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
