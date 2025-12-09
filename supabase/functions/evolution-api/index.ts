import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
}

interface RequestBody {
  action: 'create_instance' | 'connect' | 'disconnect' | 'fetch_qr' | 'check_status' | 'fetch_instances' | 'set_webhook' | 'send_text' | 'send_media' | 'find_contacts' | 'find_messages';
  instanceName?: string;
  establishmentId?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  token?: string;
  webhookUrl?: string;
  // For sending messages
  phone?: string;
  message?: string;
  // For media
  mediatype?: 'image' | 'document' | 'audio' | 'video';
  mimetype?: string;
  caption?: string;
  media?: string;
  fileName?: string;
  // For finding messages
  remoteJid?: string;
}

// Create a new Evolution API instance
async function createInstance(config: EvolutionConfig, instanceName: string, token?: string): Promise<any> {
  console.log(`Creating instance: ${instanceName}`);
  
  const response = await fetch(`${config.apiUrl}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({
      instanceName,
      token: token || `token_${instanceName}_${Date.now()}`,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Create instance error:', error);
    throw new Error(`Failed to create instance: ${error}`);
  }

  return await response.json();
}

// Get QR code for connection
async function fetchQRCode(config: EvolutionConfig, instanceName: string): Promise<any> {
  console.log(`Fetching QR for: ${instanceName}`);
  
  const response = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers: {
      'apikey': config.apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Fetch QR error:', error);
    throw new Error(`Failed to fetch QR code: ${error}`);
  }

  return await response.json();
}

// Check instance connection status
async function checkStatus(config: EvolutionConfig, instanceName: string): Promise<any> {
  console.log(`Checking status for: ${instanceName}`);
  
  const response = await fetch(`${config.apiUrl}/instance/connectionState/${instanceName}`, {
    method: 'GET',
    headers: {
      'apikey': config.apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Check status error:', error);
    throw new Error(`Failed to check status: ${error}`);
  }

  return await response.json();
}

// Fetch all instances
async function fetchInstances(config: EvolutionConfig): Promise<any> {
  console.log('Fetching all instances');
  
  const response = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
    method: 'GET',
    headers: {
      'apikey': config.apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Fetch instances error:', error);
    throw new Error(`Failed to fetch instances: ${error}`);
  }

  return await response.json();
}

// Disconnect instance
async function disconnectInstance(config: EvolutionConfig, instanceName: string): Promise<any> {
  console.log(`Disconnecting instance: ${instanceName}`);
  
  const response = await fetch(`${config.apiUrl}/instance/logout/${instanceName}`, {
    method: 'DELETE',
    headers: {
      'apikey': config.apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Disconnect error:', error);
    throw new Error(`Failed to disconnect: ${error}`);
  }

  return await response.json();
}

// Set webhook for receiving messages
async function setWebhook(config: EvolutionConfig, instanceName: string, webhookUrl: string): Promise<any> {
  console.log(`Setting webhook for: ${instanceName} -> ${webhookUrl}`);
  
  const response = await fetch(`${config.apiUrl}/webhook/set/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: true,
      events: [
        'QRCODE_UPDATED',
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Set webhook error:', error);
    throw new Error(`Failed to set webhook: ${error}`);
  }

  return await response.json();
}

// Send text message
async function sendTextMessage(config: EvolutionConfig, instanceName: string, phone: string, message: string): Promise<any> {
  console.log(`Sending text to ${phone} via ${instanceName}`);
  
  const response = await fetch(`${config.apiUrl}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Send text error:', error);
    throw new Error(`Failed to send message: ${error}`);
  }

  return await response.json();
}

// Send media (image, document, audio, video)
async function sendMedia(
  config: EvolutionConfig, 
  instanceName: string, 
  phone: string, 
  mediatype: string,
  mimetype: string,
  media: string,
  fileName?: string,
  caption?: string
): Promise<any> {
  console.log(`Sending ${mediatype} to ${phone} via ${instanceName}`);
  
  const response = await fetch(`${config.apiUrl}/message/sendMedia/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({
      number: phone,
      mediatype,
      mimetype,
      caption: caption || '',
      media,
      fileName: fileName || 'file',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Send media error:', error);
    throw new Error(`Failed to send media: ${error}`);
  }

  return await response.json();
}

// Fetch contacts
async function findContacts(config: EvolutionConfig, instanceName: string): Promise<any> {
  console.log(`Fetching contacts for: ${instanceName}`);
  
  const response = await fetch(`${config.apiUrl}/chat/findContacts/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Find contacts error:', error);
    throw new Error(`Failed to find contacts: ${error}`);
  }

  return await response.json();
}

// Find message history
async function findMessages(config: EvolutionConfig, instanceName: string, remoteJid: string): Promise<any> {
  console.log(`Fetching messages for: ${remoteJid}`);
  
  const response = await fetch(`${config.apiUrl}/chat/findMessages/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
    },
    body: JSON.stringify({
      where: {
        key: { remoteJid }
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Find messages error:', error);
    throw new Error(`Failed to find messages: ${error}`);
  }

  return await response.json();
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

    const body: RequestBody = await req.json();
    console.log('Evolution API request:', body.action);

    const { action, instanceName, establishmentId, evolutionApiUrl, evolutionApiKey } = body;

    // Get config from request, database, or environment variables (with fallback)
    let config: EvolutionConfig | null = null;
    
    // 1. First try explicit credentials from request body
    if (evolutionApiUrl && evolutionApiKey) {
      config = { apiUrl: evolutionApiUrl, apiKey: evolutionApiKey };
      console.log('Using credentials from request body');
    }
    
    // 2. Try database if establishmentId provided and no explicit config
    if (!config && establishmentId) {
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('evolution_api_url, evolution_api_key')
        .eq('establishment_id', establishmentId)
        .maybeSingle();
      
      if (instance?.evolution_api_url && instance?.evolution_api_key) {
        config = { apiUrl: instance.evolution_api_url, apiKey: instance.evolution_api_key };
        console.log('Using credentials from database');
      }
    }
    
    // 3. Fall back to environment variables
    if (!config) {
      const envUrl = Deno.env.get('EVOLUTION_API_URL');
      const envKey = Deno.env.get('EVOLUTION_API_KEY');
      
      if (envUrl && envKey) {
        config = { apiUrl: envUrl, apiKey: envKey };
        console.log('Using credentials from environment variables');
      }
    }
    
    if (!config) {
      throw new Error('Evolution API credentials required - check environment variables or database configuration');
    }

    let result: any;

    switch (action) {
      case 'create_instance':
        if (!instanceName) throw new Error('instanceName required');
        result = await createInstance(config, instanceName, body.token);
        
        // Auto-configure webhook if establishment provided
        if (establishmentId) {
          const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`;
          try {
            await setWebhook(config, instanceName, webhookUrl);
            console.log('Webhook configured automatically');
          } catch (e) {
            console.warn('Could not set webhook:', e);
          }
        }
        break;

      case 'connect':
      case 'fetch_qr':
        if (!instanceName) throw new Error('instanceName required');
        result = await fetchQRCode(config, instanceName);
        break;

      case 'check_status':
        if (!instanceName) throw new Error('instanceName required');
        result = await checkStatus(config, instanceName);
        break;

      case 'fetch_instances':
        result = await fetchInstances(config);
        break;

      case 'disconnect':
        if (!instanceName) throw new Error('instanceName required');
        result = await disconnectInstance(config, instanceName);
        break;

      case 'set_webhook':
        if (!instanceName || !body.webhookUrl) throw new Error('instanceName and webhookUrl required');
        result = await setWebhook(config, instanceName, body.webhookUrl);
        break;

      case 'send_text':
        if (!instanceName || !body.phone || !body.message) {
          throw new Error('instanceName, phone and message required');
        }
        result = await sendTextMessage(config, instanceName, body.phone, body.message);
        break;

      case 'send_media':
        if (!instanceName || !body.phone || !body.mediatype || !body.media) {
          throw new Error('instanceName, phone, mediatype and media required');
        }
        result = await sendMedia(
          config, 
          instanceName, 
          body.phone, 
          body.mediatype,
          body.mimetype || 'application/octet-stream',
          body.media,
          body.fileName,
          body.caption
        );
        break;

      case 'find_contacts':
        if (!instanceName) throw new Error('instanceName required');
        result = await findContacts(config, instanceName);
        break;

      case 'find_messages':
        if (!instanceName || !body.remoteJid) throw new Error('instanceName and remoteJid required');
        result = await findMessages(config, instanceName, body.remoteJid);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Evolution API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
