# Webhook Security Test Plan — `mercadopago-webhook`

> Cobre itens **5.2** (idempotência) e **5.4** (webhook spoof) do roadmap.

A lógica de validação está em `validateSignature()` (HMAC-SHA256 sobre
`id:${dataId};request-id:${requestId};ts:${ts};`). Em produção
(`ENVIRONMENT=production`), secret e signature são obrigatórios.

## Cenários cobertos

### 5.4.1 — Spoof de assinatura (signature inválida)

**Setup**: produção (`ENVIRONMENT=production`), `MERCADOPAGO_WEBHOOK_SECRET` setado.

**Teste**:

```bash
curl -i -X POST 'https://<project>.supabase.co/functions/v1/mercadopago-webhook' \
  -H 'content-type: application/json' \
  -H 'x-signature: ts=1700000000,v1=ATTACKER_FAKE_HASH_DEADBEEF' \
  -H 'x-request-id: spoof-test-001' \
  -d '{"action":"payment.updated","type":"payment","data":{"id":"99999"}}'
```

**Esperado**:
- Status `401 Unauthorized`
- Log: `CRITICAL: x-signature header missing` ou `Invalid signature` (no JSON)
- Banco: nenhuma row criada em `webhook_events`, `orders` ou afins.

**Falha possível**:
- Se voltar 200, o gate falhou e há vulnerabilidade crítica — auditar
  `validateSignature()` e fluxo `if (!isValid)`.

### 5.4.2 — Header ausente em produção

**Setup**: produção, `MERCADOPAGO_WEBHOOK_SECRET` setado.

**Teste**:

```bash
curl -i -X POST 'https://<project>.supabase.co/functions/v1/mercadopago-webhook' \
  -H 'content-type: application/json' \
  -d '{"action":"payment.updated","type":"payment","data":{"id":"99999"}}'
```

**Esperado**: `401 Unauthorized` (header `x-signature` faltando).

### 5.4.3 — Secret não-configurado em produção

**Setup**: produção, `MERCADOPAGO_WEBHOOK_SECRET` **não** setado.

**Teste**: qualquer POST.

**Esperado**: `401 Unauthorized` + log `CRITICAL: MERCADOPAGO_WEBHOOK_SECRET not configured in production`.

### 5.4.4 — Replay com timestamp antigo (rejeitado por janela)

> **TODO**: implementar janela de 5 min em `validateSignature()`. Hoje o
> código aceita qualquer `ts`. Adicionar:
>
> ```ts
> const tsNum = parseInt(ts, 10);
> const now = Math.floor(Date.now() / 1000);
> if (Math.abs(now - tsNum) > 300) return false;
> ```

**Teste após implementação**: assinar payload com `ts=` 10 min atrás
(usando o secret real) — esperar `401`.

### 5.2.1 — Idempotência: mesmo `data.id` recebido 2x

**Setup**: assinatura válida, payload com `data.id=PAYMENT_X` que já foi processado.

**Esperado**:
- Status `200 OK` (não rejeitar — MP retransmite até receber 200).
- Banco: exatamente **1** row em `webhook_events` para `PAYMENT_X` (ou flag
  `processed_at != null`).
- Lado do `orders`: **não** muda status duas vezes (não vira `paid` -> `paid`
  com 2 timestamps; e nunca dispara split/refund 2x).

**Teste prático** (ambiente sandbox):

```bash
# 1. Anotar payment_id do MP sandbox
PAYMENT_ID="123456789"

# 2. Buscar a assinatura real do MP (acessar dashboard do webhook)
SIG="ts=1700000000,v1=<hash-real>"

# 3. POST 1 (primeiro processamento)
curl -X POST 'https://...' -H "x-signature: $SIG" -d '{"data":{"id":"'$PAYMENT_ID'"}, ...}'

# 4. POST 2 (replay imediato — simula rede instavel)
curl -X POST 'https://...' -H "x-signature: $SIG" -d '{"data":{"id":"'$PAYMENT_ID'"}, ...}'

# 5. Conferir no banco:
psql -c "SELECT count(*), processed_at FROM webhook_events WHERE payment_id = '$PAYMENT_ID' GROUP BY processed_at"
# Esperado: 1 ou 2 rows mas com mesmo processed_at, OU 1 row com processed_at != null e a logica de save eh idempotente
```

**Falha possível**:
- Se split/refund disparou 2x → bug grave de idempotência. Verificar
  `webhook_events` tem `unique(provider, payment_id)` ou similar e que
  o handler faz `INSERT ... ON CONFLICT DO NOTHING`.

### 5.2.2 — Idempotência: pedido duplicado pelo cliente

> Não diretamente no webhook, mas na criação de pagamento (Pix preference).

**Esperado**: `mercadopago-checkout-pro` deve usar `external_reference` =
order_id e MP rejeita preferences duplicadas com mesmo external_reference
em janela curta (5 min). Verificar comportamento em sandbox.

## Como rodar end-to-end no sandbox

1. Configurar credenciais sandbox MP em ambiente staging:
   ```
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...-sandbox
   MERCADOPAGO_WEBHOOK_SECRET=<gerado pelo MP>
   ENVIRONMENT=staging
   ```
2. Criar pagamento sandbox via API MP, anotar `payment_id`.
3. Disparar testes 5.4.1 → 5.4.4 → 5.2.1 → 5.2.2 nesta ordem.
4. Conferir tabelas: `webhook_events`, `orders`, `mp_transactions`.
5. Documentar resultado em `docs/SECURITY-TESTS-LOG.md` com data e
   evidência (curl + screenshot do banco).

## Status

- ✅ 5.4.1 / 5.4.2 / 5.4.3 — **lógica implementada**, teste manual pendente
  (precisa de ambiente staging com MP credentials).
- 🟡 5.4.4 — **TODO**: janela de timestamp em `validateSignature` (5 min).
- 🟡 5.2.1 — **lógica idempotência precisa ser auditada** no handler
  (verificar `webhook_events` tem unique constraint + `ON CONFLICT`).
- 🟡 5.2.2 — pendente teste sandbox.

## Próximos passos

1. Implementar janela de TS em `validateSignature` (10 LOC).
2. Auditar handler de `webhook_events` (procurar `INSERT INTO webhook_events`).
3. Rodar suite manual em staging com MP sandbox.
4. Marcar 5.2 e 5.4 done com link pra log de evidências.
