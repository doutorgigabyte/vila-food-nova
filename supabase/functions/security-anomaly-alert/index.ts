import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnomalyAlertRequest {
  alert_type: 'high_value' | 'failed_attempts' | 'suspicious_time' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  establishment_id?: string;
  transaction_id?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is super_admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super_admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (!roleData) {
      console.error('User is not super_admin');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - super_admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: AnomalyAlertRequest = await req.json();
    console.log('Creating anomaly alert:', body);

    // Create the alert in database
    const { data: alertData, error: alertError } = await supabase
      .from('anomaly_alerts')
      .insert({
        alert_type: body.alert_type,
        severity: body.severity,
        title: body.title,
        description: body.description,
        establishment_id: body.establishment_id,
        transaction_id: body.transaction_id,
        amount: body.amount,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (alertError) {
      console.error('Error creating alert:', alertError);
      throw alertError;
    }

    console.log('Alert created:', alertData.id);

    // Check if WhatsApp alerts are enabled
    const { data: configData } = await supabase
      .from('anomaly_config')
      .select('alert_whatsapp')
      .eq('config_type', 'global')
      .eq('is_active', true)
      .single();

    if (configData?.alert_whatsapp) {
      console.log('WhatsApp alerts enabled, sending notification...');
      
      // Get Evolution API config
      const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
      const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

      if (evolutionApiUrl && evolutionApiKey) {
        // Get admin WhatsApp number from profiles or use system instance
        const { data: systemInstance } = await supabase
          .from('whatsapp_instances')
          .select('instance_name, phone_number')
          .eq('instance_type', 'system')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (systemInstance) {
          const severityEmoji = {
            low: 'ℹ️',
            medium: '⚠️',
            high: '🔶',
            critical: '🚨'
          };

          const alertTypeLabel = {
            high_value: 'Transação de Alto Valor',
            failed_attempts: 'Tentativas de Pagamento Falhas',
            suspicious_time: 'Transação em Horário Suspeito',
            unusual_pattern: 'Padrão Incomum Detectado'
          };

          const message = `${severityEmoji[body.severity]} *ALERTA DE SEGURANÇA*

📋 *Tipo:* ${alertTypeLabel[body.alert_type] || body.alert_type}
⚡ *Severidade:* ${body.severity.toUpperCase()}

📝 *${body.title}*
${body.description || ''}

${body.amount ? `💰 *Valor:* R$ ${body.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}

🕐 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}

_Acesse a Central de Segurança para mais detalhes._`;

          try {
            // Send via Evolution API to admin
            const evolutionResponse = await fetch(
              `${evolutionApiUrl}/message/sendText/${systemInstance.instance_name}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': evolutionApiKey,
                },
                body: JSON.stringify({
                  number: systemInstance.phone_number,
                  text: message,
                }),
              }
            );

            if (evolutionResponse.ok) {
              console.log('WhatsApp alert sent successfully');
              
              // Update alert with notification timestamp
              await supabase
                .from('anomaly_alerts')
                .update({ notified_at: new Date().toISOString() })
                .eq('id', alertData.id);
            } else {
              console.error('Failed to send WhatsApp alert:', await evolutionResponse.text());
            }
          } catch (whatsappError) {
            console.error('WhatsApp notification error:', whatsappError);
          }
        } else {
          console.log('No system WhatsApp instance configured');
        }
      } else {
        console.log('Evolution API not configured');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alert_id: alertData.id,
        whatsapp_enabled: configData?.alert_whatsapp || false
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in security-anomaly-alert:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});