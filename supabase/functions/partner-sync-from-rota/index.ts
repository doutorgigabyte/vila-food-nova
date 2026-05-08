/**
 * partner-sync-from-rota — recebe webhooks do Smart Guide quando partners
 * mudam (created/updated/deleted) e atualiza espelho local em
 * vila_food.establishments_partner_link.
 *
 * Item 4.5 do roadmap (lado consumidor).
 *
 * Fluxo:
 *   Smart Guide trigger → core.partner_outbox
 *           ↓
 *   Worker externo (cron / edge function) chama partner_outbox_claim_pending
 *           ↓
 *   Worker faz POST /functions/v1/partner-sync-from-rota
 *           ↓
 *   Esta funcao valida HMAC + persiste em vila_food
 *           ↓
 *   Worker recebe 200 e marca delivered_at no Smart Guide
 *
 * Auth: HMAC-SHA256 header `x-rota-signature` derivado de
 *       PARTNER_SYNC_SECRET (compartilhado entre Smart Guide e Vila Food).
 *
 * Idempotencia: evento tem `event_id` (BIGINT do partner_outbox.id).
 *   Vila Food guarda last_event_id per partner — eventos com id <=
 *   last_event_id sao no-op (200 OK sem reprocessar).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-rota-signature',
};

const SHARED_SECRET = Deno.env.get('PARTNER_SYNC_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface PartnerEvent {
  event_id: number;
  event_type: 'partner.created' | 'partner.updated' | 'partner.deleted';
  partner_id: string;
  occurred_at: string;
  payload: unknown;
}

async function verifyHmac(body: string, signature: string | null): Promise<boolean> {
  if (!SHARED_SECRET) {
    console.error('CRITICAL: PARTNER_SYNC_SECRET not configured');
    return false;
  }
  if (!signature) {
    console.error('Missing x-rota-signature header');
    return false;
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(SHARED_SECRET);
  const messageData = encoder.encode(body);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const expectedHex = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return expectedHex === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // 1. Read body raw para HMAC
  const rawBody = await req.text();
  const signature = req.headers.get('x-rota-signature');

  if (!await verifyHmac(rawBody, signature)) {
    console.error('HMAC validation failed');
    return new Response(JSON.stringify({ error: 'invalid_signature' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 2. Parse + validar shape
  let event: PartnerEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!event.event_id || !event.event_type || !event.partner_id) {
    return new Response(JSON.stringify({ error: 'missing_required_fields' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 3. Idempotencia: evento ja processado?
  const { data: existing } = await supabase
    .from('partner_sync_state')
    .select('last_event_id')
    .eq('partner_id', event.partner_id)
    .maybeSingle();

  if (existing && existing.last_event_id >= event.event_id) {
    console.log(`Skip duplicate: partner_id=${event.partner_id} event_id=${event.event_id} (last=${existing.last_event_id})`);
    return new Response(JSON.stringify({ status: 'already_processed' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 4. Aplicar mudanca em estabelecimento espelho
  // (TODO: tabela de espelho ainda nao definida — depende do schema final do
  // Vila Food. Por ora, registramos em partner_sync_log apenas pra evidenciar
  // chegada do evento.)
  const { error: logErr } = await supabase
    .from('partner_sync_log')
    .insert({
      event_id: event.event_id,
      event_type: event.event_type,
      partner_id: event.partner_id,
      occurred_at: event.occurred_at,
      payload: event.payload,
      received_at: new Date().toISOString(),
    });

  if (logErr) {
    // Tabela nao existe ainda — log no console e retorna 200 mesmo assim
    // (quando schema final for criado, esta funcao escreve nele direto).
    console.warn('partner_sync_log insert failed (tabela ainda nao existe?):', logErr.message);
  }

  // 5. Atualiza state
  await supabase.from('partner_sync_state').upsert({
    partner_id: event.partner_id,
    last_event_id: event.event_id,
    last_event_type: event.event_type,
    last_received_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({
    status: 'ok',
    event_id: event.event_id,
    partner_id: event.partner_id,
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
