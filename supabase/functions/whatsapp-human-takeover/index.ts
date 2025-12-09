import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HumanTakeoverRequest {
  session_id?: string;
  customer_phone?: string;
  instance_name?: string;
  action: 'pause' | 'resume';
  reason?: string;
  operator_name?: string;
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

    const body: HumanTakeoverRequest = await req.json();
    const { session_id, customer_phone, instance_name, action, reason, operator_name } = body;

    console.log('Human Takeover Request:', JSON.stringify(body, null, 2));

    if (!action || !['pause', 'resume'].includes(action)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid action. Must be "pause" or "resume"' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find session by ID, phone, or instance_name
    let sessionQuery = supabase.from('whatsapp_sessions').select('*');

    if (session_id) {
      sessionQuery = sessionQuery.eq('id', session_id);
    } else if (customer_phone && instance_name) {
      // Find establishment by instance_name first
      const { data: establishment } = await supabase
        .from('establishments')
        .select('id')
        .eq('whatsapp_instance_name', instance_name)
        .single();

      if (!establishment) {
        return new Response(JSON.stringify({ 
          error: 'Establishment not found for instance_name' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      sessionQuery = sessionQuery
        .eq('customer_phone', customer_phone)
        .eq('establishment_id', establishment.id)
        .order('created_at', { ascending: false })
        .limit(1);
    } else {
      return new Response(JSON.stringify({ 
        error: 'Must provide session_id or (customer_phone + instance_name)' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: sessions, error: sessionError } = await sessionQuery;

    if (sessionError || !sessions || sessions.length === 0) {
      console.error('Session not found:', sessionError);
      return new Response(JSON.stringify({ 
        error: 'Session not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = sessions[0];

    // Update session based on action
    const updateData = action === 'pause' 
      ? {
          ai_active: false,
          pause_reason: reason || 'Takeover by human operator',
          paused_by: operator_name || 'n8n_webhook',
          updated_at: new Date().toISOString()
        }
      : {
          ai_active: true,
          pause_reason: null,
          paused_by: null,
          updated_at: new Date().toISOString()
        };

    const { error: updateError } = await supabase
      .from('whatsapp_sessions')
      .update(updateData)
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
      throw updateError;
    }

    // Log the action
    await supabase.from('agent_action_logs').insert({
      session_id: session.id,
      establishment_id: session.establishment_id,
      action_type: action === 'pause' ? 'human_takeover_webhook' : 'ai_resumed_webhook',
      action_data: { 
        reason, 
        operator_name,
        source: 'n8n_webhook' 
      },
      success: true,
      execution_time_ms: 0
    });

    // Create notification for the establishment
    await supabase.from('notifications').insert({
      establishment_id: session.establishment_id,
      type: 'system',
      title: action === 'pause' 
        ? '🔔 Atendimento assumido por humano' 
        : '🤖 IA retomou o atendimento',
      message: action === 'pause'
        ? `${operator_name || 'Operador'} assumiu a conversa com ${session.customer_name || session.customer_phone}. Motivo: ${reason || 'Não informado'}`
        : `A IA retomou o atendimento de ${session.customer_name || session.customer_phone}`,
      priority: 'medium',
      data: {
        session_id: session.id,
        customer_phone: session.customer_phone,
        action
      }
    });

    console.log(`Human takeover ${action} successful for session ${session.id}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      session_id: session.id,
      customer_phone: session.customer_phone,
      ai_active: action === 'resume',
      message: action === 'pause' 
        ? 'AI paused, human operator has taken over' 
        : 'AI resumed for this session'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Human Takeover error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
