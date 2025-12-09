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

// Evolution API v2 webhook payload types
interface WebhookPayload {
  event: 'QRCODE_UPDATED' | 'CONNECTION_UPDATE' | 'MESSAGES_UPSERT' | 'MESSAGES_UPDATE' | string;
  instance: string;
  data: any;
  apikey?: string;
}

interface ConnectionUpdateData {
  state: 'open' | 'close' | 'connecting';
}

interface QRCodeUpdateData {
  qrcode: {
    base64: string;
    pairingCode?: string;
  };
}

interface KeywordData {
  keywords: string[];
  response_text: string;
  send_menu_link: boolean;
}

// Check if message matches any keyword
async function checkKeywordMatch(
  establishmentId: string,
  messageContent: string,
  supabaseClient: any
): Promise<{ matched: boolean; response: string; includeMenuLink: boolean } | null> {
  const { data: keywords } = await supabaseClient
    .from('whatsapp_keywords')
    .select('keywords, response_text, send_menu_link')
    .eq('establishment_id', establishmentId)
    .eq('is_active', true);

  if (!keywords || keywords.length === 0) return null;

  const normalizedMessage = messageContent.toLowerCase().trim();

  for (const kw of keywords as KeywordData[]) {
    const keywordList = kw.keywords || [];
    for (const keyword of keywordList) {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        return {
          matched: true,
          response: kw.response_text,
          includeMenuLink: kw.send_menu_link,
        };
      }
    }
  }

  return null;
}

// Send message via Evolution API
async function sendWhatsAppMessage(
  evolutionApiUrl: string,
  evolutionApiKey: string,
  instanceName: string,
  phone: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
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

    const payload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Handle test/health check requests
    if (payload.test === true || !payload.instance) {
      console.log('Test request or missing instance, returning OK');
      return new Response(JSON.stringify({ 
        status: 'ok', 
        message: 'Webhook is working. Send Evolution API events with instance name.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { event, instance, data } = payload as WebhookPayload;

    // Find WhatsApp instance by name
    const { data: whatsappInstance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*, establishments(*)')
      .eq('instance_name', instance)
      .single();

    if (instanceError || !whatsappInstance) {
      console.error('Instance not found:', instance);
      return new Response(JSON.stringify({ error: 'Instance not found', instance }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const establishmentId = whatsappInstance.establishment_id;

    // Handle different event types
    switch (event) {
      case 'QRCODE_UPDATED': {
        // Update QR code in database for real-time display
        const qrData = data as QRCodeUpdateData;
        console.log('QR Code updated for:', instance);
        
        await supabase
          .from('whatsapp_instances')
          .update({ 
            qr_code: qrData.qrcode?.base64 || null,
            status: 'connecting',
          })
          .eq('id', whatsappInstance.id);

        return new Response(JSON.stringify({ status: 'qr_updated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'CONNECTION_UPDATE': {
        // Update connection status
        const connectionData = data as ConnectionUpdateData;
        console.log('Connection update for:', instance, connectionData.state);
        
        let status = 'disconnected';
        if (connectionData.state === 'open') {
          status = 'connected';
        } else if (connectionData.state === 'connecting') {
          status = 'connecting';
        }

        await supabase
          .from('whatsapp_instances')
          .update({ 
            status,
            qr_code: connectionData.state === 'open' ? null : whatsappInstance.qr_code,
          })
          .eq('id', whatsappInstance.id);

        // Log analytics
        await supabase.from('whatsapp_analytics').insert({
          establishment_id: establishmentId,
          event_type: 'connection_status',
          event_data: { status, previous_status: whatsappInstance.status },
        });

        return new Response(JSON.stringify({ status: 'connection_updated', state: status }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'MESSAGES_UPDATE': {
        // Message status update (read, delivered, etc.)
        console.log('Message status update:', data);
        return new Response(JSON.stringify({ status: 'message_status_logged' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'MESSAGES_UPSERT':
      case 'messages.upsert': {
        // Handle incoming messages
        const messageData = data as EvolutionMessage;
        
        // Ignore outgoing messages
        if (!messageData || messageData.key?.fromMe) {
          return new Response(JSON.stringify({ status: 'ignored', reason: 'outgoing_message' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const establishment = whatsappInstance.establishments;
        const customerPhone = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
        const customerName = messageData.pushName || 'Cliente';
        const whatsappLevel = whatsappInstance.whatsapp_level || 1;

        // Extract message content
        let messageContent = '';
        let messageType = 'text';

        if (messageData.message?.conversation) {
          messageContent = messageData.message.conversation;
        } else if (messageData.message?.extendedTextMessage?.text) {
          messageContent = messageData.message.extendedTextMessage.text;
        } else if (messageData.message?.imageMessage) {
          messageContent = messageData.message.imageMessage.caption || '[Imagem]';
          messageType = 'image';
        } else if (messageData.message?.audioMessage) {
          messageContent = '[Áudio]';
          messageType = 'audio';
        } else if (messageData.message?.documentMessage) {
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

        const isNewSession = !session;

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

        // Save incoming message
        await supabase.from('whatsapp_messages').insert({
          session_id: session.id,
          sender: customerPhone,
          content: messageContent,
          message_type: messageType,
          is_from_bot: false,
        });

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

        let autoResponse: string | null = null;
        let shouldEscalateToAI = false;

        // TIER 1: Keyword-based responses (if keywords_enabled)
        if (whatsappInstance.keywords_enabled !== false) {
          // Check for welcome message on new session
          if (isNewSession && whatsappInstance.welcome_message) {
            autoResponse = whatsappInstance.welcome_message;
          } else {
            // Check keyword match
            const keywordMatch = await checkKeywordMatch(establishmentId, messageContent, supabase);
            
            if (keywordMatch?.matched) {
              autoResponse = keywordMatch.response;
              
              // Add menu link if configured
              if (keywordMatch.includeMenuLink && establishment?.slug) {
                const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '');
                const menuUrl = `${baseUrl}.lovable.app/${establishment.slug}`;
                autoResponse += `\n\n🔗 ${menuUrl}`;
              }
            }
          }
        }

        // TIER 2: AI Agent (if level 2 and no keyword match or escalation needed)
        if (whatsappLevel === 2 && !autoResponse && whatsappInstance.ai_enabled) {
          shouldEscalateToAI = true;
        }

        // Send auto-response if we have one
        if (autoResponse && whatsappInstance.evolution_api_url && whatsappInstance.evolution_api_key) {
          const sent = await sendWhatsAppMessage(
            whatsappInstance.evolution_api_url,
            whatsappInstance.evolution_api_key,
            instance,
            customerPhone,
            autoResponse
          );

          if (sent) {
            // Save bot response
            await supabase.from('whatsapp_messages').insert({
              session_id: session.id,
              sender: 'bot',
              content: autoResponse,
              message_type: 'text',
              is_from_bot: true,
            });

            // Log analytics
            await supabase.from('whatsapp_analytics').insert({
              establishment_id: establishmentId,
              session_id: session.id,
              event_type: 'auto_response_sent',
              event_data: {
                response_type: isNewSession ? 'welcome' : 'keyword',
                response: autoResponse,
              },
            });
          }
        }

        // Return data for further processing (N8N or AI)
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
          whatsapp_level: whatsappLevel,
          auto_response_sent: !!autoResponse,
          should_escalate_to_ai: shouldEscalateToAI,
          ai_enabled: whatsappInstance.ai_enabled,
          ai_prompt: whatsappInstance.ai_prompt,
          ai_model: whatsappInstance.ai_model || 'google/gemini-2.5-flash',
          establishment: establishment,
          cart: session.cart || [],
          context: session.context || {},
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        console.log('Unhandled event type:', event);
        return new Response(JSON.stringify({ status: 'unhandled_event', event }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
