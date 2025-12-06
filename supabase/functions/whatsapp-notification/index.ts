import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  phone: string;
  message: string;
  type: 'affiliate_payout' | 'order_status' | 'payment_received' | 'system_alert' | 'maintenance' | 'general';
  metadata?: Record<string, any>;
  instanceType?: 'system' | 'establishment';
  establishmentId?: string;
}

interface WhatsAppInstance {
  instance_id: string;
  instance_name: string;
  evolution_api_url?: string;
  evolution_api_key?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Configurações padrão da Evolution API
    const defaultEvolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const defaultEvolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    const { phone, message, type, metadata, instanceType, establishmentId } = await req.json() as NotificationRequest;

    if (!phone || !message) {
      throw new Error('Phone and message are required');
    }

    // Determinar qual instância usar baseado no tipo de notificação
    let instance: WhatsAppInstance | null = null;
    let evolutionApiUrl = defaultEvolutionApiUrl;
    let evolutionApiKey = defaultEvolutionApiKey;

    // Tipos de notificação que usam instância do sistema
    const systemNotificationTypes = ['system_alert', 'maintenance', 'affiliate_payout'];
    const useSystemInstance = instanceType === 'system' || systemNotificationTypes.includes(type);

    if (useSystemInstance) {
      // Buscar instância do sistema (Doutorgigabyte)
      const { data: systemInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_id, instance_name, evolution_api_url, evolution_api_key')
        .eq('instance_type', 'system')
        .eq('status', 'connected')
        .single();

      if (systemInstance) {
        instance = systemInstance;
        evolutionApiUrl = systemInstance.evolution_api_url || defaultEvolutionApiUrl;
        evolutionApiKey = systemInstance.evolution_api_key || defaultEvolutionApiKey;
        console.log(`Using system instance: ${instance.instance_name}`);
      }
    } else if (establishmentId) {
      // Buscar instância do estabelecimento
      const { data: estInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_id, instance_name, evolution_api_url, evolution_api_key')
        .eq('establishment_id', establishmentId)
        .eq('status', 'connected')
        .single();

      if (estInstance) {
        instance = estInstance;
        evolutionApiUrl = estInstance.evolution_api_url || defaultEvolutionApiUrl;
        evolutionApiKey = estInstance.evolution_api_key || defaultEvolutionApiKey;
        console.log(`Using establishment instance: ${instance.instance_name}`);
      }
    }

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('Evolution API credentials not configured');
      throw new Error('Evolution API credentials not configured');
    }

    // Determinar nome da instância a usar na API
    const instanceName = instance?.instance_name || 'vilafood';

    // Formatar número de telefone (remover caracteres não numéricos e adicionar código do país)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    console.log(`Sending ${type} notification to ${formattedPhone} via instance ${instanceName}`);

    // Enviar mensagem via Evolution API
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
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

    // Registrar notificação no banco de dados
    await supabase.from('whatsapp_analytics').insert({
      establishment_id: metadata?.establishment_id || establishmentId || '00000000-0000-0000-0000-000000000000',
      event_type: `notification_${type}`,
      event_data: {
        phone: formattedPhone,
        message_preview: message.substring(0, 100),
        instance_used: instanceName,
        instance_type: useSystemInstance ? 'system' : 'establishment',
        metadata,
        sent_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ success: true, message_id: result?.key?.id, instance_used: instanceName }),
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
