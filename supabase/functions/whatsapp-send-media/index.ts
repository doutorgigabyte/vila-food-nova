import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMediaRequest {
  instance_name?: string;
  establishment_id?: string;
  phone: string;
  remote_jid?: string; // n8n compatibility
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
    const { 
      instance_name, 
      establishment_id,
      phone, 
      remote_jid,
      media_url, 
      media_type = 'image', 
      caption, 
      file_name, 
      session_id, 
      product_id 
    } = body;

    // Support both phone and remote_jid (n8n compatibility)
    const targetPhone = phone || remote_jid?.replace('@s.whatsapp.net', '');

    console.log('Send Media Request:', { instance_name, establishment_id, phone: targetPhone, media_type, media_url });

    let evolutionUrl: string | null = null;
    let evolutionKey: string | null = null;
    let instanceToUse = instance_name;
    let establishmentId = establishment_id;

    // Strategy 1: Try to get from whatsapp_instances table (legacy)
    if (instance_name) {
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instance_name)
        .single();

      if (!instanceError && instance) {
        evolutionUrl = instance.evolution_api_url;
        evolutionKey = instance.evolution_api_key;
        establishmentId = instance.establishment_id;
      }
    }

    // Strategy 2: Get from establishments table (n8n multi-tenant)
    if (establishment_id && !evolutionUrl) {
      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .select('whatsapp_instance_name, evolution_api_token')
        .eq('id', establishment_id)
        .single();

      if (!estError && establishment) {
        instanceToUse = establishment.whatsapp_instance_name || instance_name;
        evolutionKey = establishment.evolution_api_token;
        evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || null;
      }
    }

    // Fallback to global Evolution API config
    if (!evolutionUrl) {
      evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || null;
    }
    if (!evolutionKey) {
      evolutionKey = Deno.env.get('EVOLUTION_API_KEY') || null;
    }

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API not configured');
    }

    if (!instanceToUse) {
      throw new Error('No WhatsApp instance specified');
    }

    // Clean URL
    evolutionUrl = evolutionUrl.replace(/\/$/, '');

    // Determine the Evolution API endpoint based on media type
    let endpoint: string;
    let payload: Record<string, unknown>;

    switch (media_type) {
      case 'image':
        endpoint = `${evolutionUrl}/message/sendMedia/${instanceToUse}`;
        payload = {
          number: targetPhone,
          mediatype: 'image',
          media: media_url,
          caption: caption || '',
        };
        break;

      case 'video':
        endpoint = `${evolutionUrl}/message/sendMedia/${instanceToUse}`;
        payload = {
          number: targetPhone,
          mediatype: 'video',
          media: media_url,
          caption: caption || '',
        };
        break;

      case 'audio':
        endpoint = `${evolutionUrl}/message/sendWhatsAppAudio/${instanceToUse}`;
        payload = {
          number: targetPhone,
          audio: media_url,
        };
        break;

      case 'document':
        endpoint = `${evolutionUrl}/message/sendMedia/${instanceToUse}`;
        payload = {
          number: targetPhone,
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
        'apikey': evolutionKey,
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
        establishment_id: establishmentId,
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