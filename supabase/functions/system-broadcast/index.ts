import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaign_id, template_name, template_data, single_phone } = await req.json();
    
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    const systemInstance = 'Doutorgigabyte'; // Instância do sistema

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API not configured');
    }

    // Função para enviar mensagem via Evolution API
    const sendWhatsAppMessage = async (phone: string, message: string, mediaUrl?: string) => {
      const formattedPhone = phone.replace(/\D/g, '');
      
      let endpoint = `${evolutionUrl}/message/sendText/${systemInstance}`;
      let body: any = {
        number: formattedPhone,
        text: message
      };

      if (mediaUrl) {
        endpoint = `${evolutionUrl}/message/sendMedia/${systemInstance}`;
        body = {
          number: formattedPhone,
          mediatype: 'image',
          media: mediaUrl,
          caption: message
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error sending message:', result);
        throw new Error(result.message || 'Failed to send message');
      }

      return result;
    };

    // Modo 1: Envio único com template (para autenticação, notificações pontuais)
    if (template_name && single_phone) {
      console.log(`Sending template "${template_name}" to ${single_phone}`);
      
      // Buscar template
      const { data: template, error: templateError } = await supabase
        .from('system_message_templates')
        .select('*')
        .eq('name', template_name)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        throw new Error(`Template "${template_name}" not found`);
      }

      // Substituir variáveis
      let message = template.message;
      if (template_data) {
        for (const [key, value] of Object.entries(template_data)) {
          message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
        }
      }

      await sendWhatsAppMessage(single_phone, message);

      return new Response(
        JSON.stringify({ success: true, message: 'Message sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Modo 2: Campanha em massa
    if (campaign_id) {
      console.log(`Processing campaign ${campaign_id}`);

      // Buscar campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('broadcast_campaigns')
        .select('*')
        .eq('id', campaign_id)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Buscar contatos elegíveis
      let query = supabase
        .from('system_contacts')
        .select('*')
        .eq('is_active', true)
        .eq('opted_in_broadcasts', true);

      if (!campaign.target_all && campaign.target_tags.length > 0) {
        query = query.overlaps('tags', campaign.target_tags);
      }

      const { data: contacts, error: contactsError } = await query;

      if (contactsError) {
        throw new Error('Error fetching contacts');
      }

      console.log(`Found ${contacts?.length || 0} eligible contacts`);

      let sentCount = 0;
      let failedCount = 0;

      // Enviar mensagens com delay para evitar bloqueio
      for (const contact of contacts || []) {
        try {
          await sendWhatsAppMessage(contact.phone, campaign.message, campaign.media_url);

          // Registrar mensagem enviada
          await supabase.from('broadcast_messages').insert({
            campaign_id: campaign_id,
            contact_id: contact.id,
            phone: contact.phone,
            status: 'sent',
            sent_at: new Date().toISOString()
          });

          // Atualizar last_message_at do contato
          await supabase
            .from('system_contacts')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', contact.id);

          sentCount++;
          console.log(`Sent to ${contact.phone} (${sentCount}/${contacts?.length})`);

          // Delay de 2 segundos entre mensagens
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error: any) {
          console.error(`Failed to send to ${contact.phone}:`, error);

          await supabase.from('broadcast_messages').insert({
            campaign_id: campaign_id,
            contact_id: contact.id,
            phone: contact.phone,
            status: 'failed',
            error_message: error?.message || 'Unknown error'
          });

          failedCount++;
        }
      }

      // Atualizar campanha
      await supabase
        .from('broadcast_campaigns')
        .update({
          status: failedCount === (contacts?.length || 0) ? 'failed' : 'completed',
          sent_count: sentCount,
          failed_count: failedCount,
          completed_at: new Date().toISOString()
        })
        .eq('id', campaign_id);

      return new Response(
        JSON.stringify({
          success: true,
          sent_count: sentCount,
          failed_count: failedCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid request: provide campaign_id or template_name with single_phone');

  } catch (error: any) {
    console.error('System broadcast error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
