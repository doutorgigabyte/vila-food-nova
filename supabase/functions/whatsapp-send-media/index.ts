import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMediaRequest {
  instance_name: string;
  phone: string;
  media_url: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  file_name?: string;
  session_id?: string;
  product_id?: string;
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

    const body: SendMediaRequest = await req.json();
    const { instance_name, phone, media_url, media_type, caption, file_name, session_id, product_id } = body;

    console.log('Send Media Request:', { instance_name, phone, media_type, media_url });

    // Find WhatsApp instance
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instance_name)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instance not found');
    }

    if (!instance.evolution_api_url || !instance.evolution_api_key) {
      throw new Error('Evolution API not configured');
    }

    // Determine the Evolution API endpoint based on media type
    let endpoint: string;
    let payload: Record<string, unknown>;

    switch (media_type) {
      case 'image':
        endpoint = `${instance.evolution_api_url}/message/sendMedia/${instance_name}`;
        payload = {
          number: phone,
          mediatype: 'image',
          media: media_url,
          caption: caption || '',
        };
        break;

      case 'video':
        endpoint = `${instance.evolution_api_url}/message/sendMedia/${instance_name}`;
        payload = {
          number: phone,
          mediatype: 'video',
          media: media_url,
          caption: caption || '',
        };
        break;

      case 'audio':
        endpoint = `${instance.evolution_api_url}/message/sendWhatsAppAudio/${instance_name}`;
        payload = {
          number: phone,
          audio: media_url,
        };
        break;

      case 'document':
        endpoint = `${instance.evolution_api_url}/message/sendMedia/${instance_name}`;
        payload = {
          number: phone,
          mediatype: 'document',
          media: media_url,
          caption: caption || '',
          fileName: file_name || 'document',
        };
        break;

      default:
        throw new Error(`Unsupported media type: ${media_type}`);
    }

    console.log('Evolution API Request:', { endpoint, payload });

    // Send media via Evolution API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instance.evolution_api_key,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API Error:', response.status, errorText);
      throw new Error(`Evolution API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Evolution API Response:', result);

    // Log the message in database if session_id provided
    if (session_id) {
      await supabase.from('whatsapp_messages').insert({
        session_id,
        sender: 'bot',
        content: caption || `[${media_type}]`,
        message_type: media_type,
        media_url,
        media_type,
        product_id: product_id || null,
        is_from_bot: true,
      });

      // Log analytics
      await supabase.from('whatsapp_analytics').insert({
        establishment_id: instance.establishment_id,
        session_id,
        event_type: 'media_sent',
        event_data: {
          media_type,
          media_url,
          product_id,
          caption,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: result.key?.id,
      result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Send Media error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});