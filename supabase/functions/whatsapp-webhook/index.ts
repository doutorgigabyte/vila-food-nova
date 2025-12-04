import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { url?: string; caption?: string };
    audioMessage?: { url?: string };
    documentMessage?: { url?: string };
  };
  messageType?: string;
  messageTimestamp?: number;
}

interface WebhookPayload {
  event: string;
  instance: string;
  data: EvolutionMessage;
  apikey?: string;
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

    const payload: WebhookPayload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    const { event, instance, data } = payload;

    // Only process incoming messages
    if (event !== 'messages.upsert' || !data || data.key?.fromMe) {
      return new Response(JSON.stringify({ status: 'ignored', event }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find establishment by instance name
    const { data: whatsappInstance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*, establishments(*)')
      .eq('instance_name', instance)
      .single();

    if (instanceError || !whatsappInstance) {
      console.error('Instance not found:', instance);
      return new Response(JSON.stringify({ error: 'Instance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const establishmentId = whatsappInstance.establishment_id;
    const customerPhone = data.key.remoteJid.replace('@s.whatsapp.net', '');
    const customerName = data.pushName || 'Cliente';

    // Extract message content
    let messageContent = '';
    let messageType = 'text';

    if (data.message?.conversation) {
      messageContent = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
      messageContent = data.message.extendedTextMessage.text;
    } else if (data.message?.imageMessage) {
      messageContent = data.message.imageMessage.caption || '[Imagem]';
      messageType = 'image';
    } else if (data.message?.audioMessage) {
      messageContent = '[Áudio]';
      messageType = 'audio';
    } else if (data.message?.documentMessage) {
      messageContent = '[Documento]';
      messageType = 'document';
    }

    // Find or create session
    let { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('establishment_id', establishmentId)
      .eq('customer_phone', customerPhone)
      .eq('status', 'active')
      .single();

    if (!session) {
      const { data: newSession, error: sessionError } = await supabase
        .from('whatsapp_sessions')
        .insert({
          establishment_id: establishmentId,
          customer_phone: customerPhone,
          customer_name: customerName,
          status: 'active',
          context: {},
          cart: [],
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw sessionError;
      }
      session = newSession;
    }

    // Save message
    const { error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        session_id: session.id,
        sender: customerPhone,
        content: messageContent,
        message_type: messageType,
        is_from_bot: false,
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
    }

    // Log analytics event
    await supabase.from('whatsapp_analytics').insert({
      establishment_id: establishmentId,
      session_id: session.id,
      event_type: 'message_received',
      event_data: {
        message_type: messageType,
        customer_phone: customerPhone,
        content_length: messageContent.length,
      },
    });

    // Update session last_message_at
    await supabase
      .from('whatsapp_sessions')
      .update({ 
        last_message_at: new Date().toISOString(),
        customer_name: customerName 
      })
      .eq('id', session.id);

    // Return session data for N8N to process
    return new Response(JSON.stringify({
      success: true,
      session_id: session.id,
      establishment_id: establishmentId,
      customer_phone: customerPhone,
      customer_name: customerName,
      message: {
        content: messageContent,
        type: messageType,
      },
      ai_enabled: whatsappInstance.ai_enabled,
      ai_prompt: whatsappInstance.ai_prompt,
      establishment: whatsappInstance.establishments,
      cart: session.cart || [],
      context: session.context || {},
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
