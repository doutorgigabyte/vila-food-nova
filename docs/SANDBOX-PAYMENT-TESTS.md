# Sandbox Payment Tests — Playbook

> Cobre itens **5.1**, **5.3**, **5.5**, **5.6** do roadmap. Cada cenário tem
> setup, comandos curl, esperado, e troubleshooting comum.
>
> Pré-requisitos comuns:
> - Conta Mercado Pago sandbox (https://www.mercadopago.com.br/developers/panel)
> - Credenciais sandbox em `staging` (Coolify env vars):
>   - `MERCADOPAGO_ACCESS_TOKEN=APP_USR-...-sandbox`
>   - `MERCADOPAGO_WEBHOOK_SECRET=<gerado>`
>   - `ENVIRONMENT=staging`
> - `psql` acesso ao DB do Vila Food em staging
> - Marina Cafe seedada (`vila-food-nova/supabase/seeds/marina_cafe_emporio.sql`)

---

## 5.1 — Pedido simples R$ 50

**Objetivo**: validar happy path completo: cliente cria pedido, paga via Pix
sandbox, webhook confirma, escrow é colocado em hold, pedido vira "confirmed".

### Setup

1. Marina Cafe seedada com `establishment_id = e1111111-aaaa-...`
2. 1 produto cadastrado, preço `R$ 50,00`

### Execução

```bash
# 1. Criar pedido via app (frontend) ou direto via API:
ORDER_ID=$(curl -X POST 'https://staging-api.../orders' -H "Content-Type: application/json" -d '{
  "establishment_id": "e1111111-aaaa-bbbb-cccc-000000000001",
  "items": [{"product_id": "p1", "qty": 1, "unit_price_cents": 5000}],
  "customer": {"name":"Cliente Sandbox","email":"sandbox@test.com","phone":"+55819..."}
}' | jq -r '.id')

# 2. Iniciar checkout Pix (cria preference no MP)
PIX_RESP=$(curl -X POST 'https://staging.../functions/v1/mercadopago-pix' \
  -H 'Authorization: Bearer <anon>' \
  -d "{\"order_id\":\"$ORDER_ID\",\"establishment_id\":\"e1111111-...\"}")
echo $PIX_RESP | jq

# 3. Pagar manualmente: usar QR code do response em sandbox.mercadopago.com.br
#    Cartão de teste: 4509 9535 6623 3704 / 11/25 / CVV 123 / Nome APRO

# 4. Aguardar webhook (5-30s). Conferir banco:
psql -c "SELECT id, status, escrow_state FROM orders WHERE id = '$ORDER_ID'"
# Esperado: status=confirmed
psql -c "SELECT * FROM payment_split_items WHERE order_id = '$ORDER_ID'"
# Esperado: escrow_state=held, available_at = paid_at + 7d
```

### Critérios de sucesso

| Check | Esperado |
|-------|----------|
| `orders.status` | `confirmed` |
| `mp_transactions.status` | `approved` |
| `payment_split_items.escrow_state` | `held` |
| `payment_split_items.available_at` | `paid_at + 7 days` |
| `cash_flow.amount` | `R$ 50,00` (1 row) |
| `cash_flow` rows count | exatamente 1 (idempotência) |

### Falhas comuns

- **Webhook não chega**: verificar `MERCADOPAGO_WEBHOOK_SECRET` ativo no Coolify
- **HMAC inválido**: secret precisa bater com o configurado no painel MP
- **`cash_flow` com 2 rows**: bug de idempotência (ver spawn task associada)

---

## 5.3 — Cancelamento + reembolso

**Objetivo**: validar fluxo de reembolso. Cliente paga, escrow está held,
cliente abre disputa em até 7 dias, admin resolve "favor do cliente",
estorno é disparado.

### Setup

Continuar do 5.1: pedido `$ORDER_ID` confirmado, escrow held.

### Execução

```bash
# 1. Cliente abre disputa (D+1 do pagamento)
DISPUTE_ID=$(curl -X POST 'https://staging.../rest/v1/rpc/dispute_create' \
  -H 'apikey: <anon>' \
  -H 'Authorization: Bearer <auth-token-cliente>' \
  -d "{\"p_order_id\":\"$ORDER_ID\",\"p_reason\":\"Não recebi o produto\"}" | jq -r '.id')

# 2. Verificar dispute aberta + escrow segue held
psql -c "SELECT id, status FROM disputes WHERE id = '$DISPUTE_ID'"
# Esperado: status=pending
psql -c "SELECT escrow_state FROM payment_split_items WHERE order_id = '$ORDER_ID'"
# Esperado: held (não foi released — disputa segura o repasse)

# 3. Admin resolve favor do cliente
curl -X POST 'https://staging.../rest/v1/rpc/dispute_admin_update' \
  -H 'apikey: <anon>' \
  -H 'Authorization: Bearer <admin-jwt>' \
  -d "{\"p_id\":\"$DISPUTE_ID\",\"p_changes\":{\"status\":\"resolved\",\"resolution_notes\":\"Cliente provou não-entrega\",\"refund\":true}}"

# 4. Disparar estorno via API MP (ou auto pelo handler)
curl -X POST 'https://staging.../functions/v1/auto-refund' \
  -H 'Authorization: Bearer <service-role>' \
  -d "{\"order_id\":\"$ORDER_ID\"}"

# 5. Conferir
psql -c "SELECT status FROM orders WHERE id = '$ORDER_ID'"
# Esperado: cancelled
psql -c "SELECT escrow_state FROM payment_split_items WHERE order_id = '$ORDER_ID'"
# Esperado: refunded
psql -c "SELECT * FROM mp_transactions WHERE order_id = '$ORDER_ID' AND type = 'refund'"
# Esperado: 1 row com status=approved
```

### Critérios de sucesso

| Check | Esperado |
|-------|----------|
| `disputes.status` | `resolved` |
| `orders.status` | `cancelled` |
| `payment_split_items.escrow_state` | `refunded` |
| Estorno MP | 1 transaction tipo `refund` aprovada |
| `cash_flow` | 1 row tipo `refund` (negativo) |

---

## 5.5 — Pedido multi-loja (1 cliente, 2 restaurantes)

**Objetivo**: validar split correto quando carrinho tem itens de 2
estabelecimentos. Cada restaurante recebe sua parcela independente.

### Setup

- Marina Cafe (estab 1) + segunda loja seedada (estab 2)
- Cliente adiciona 1 item de cada (`R$ 30 + R$ 40 = R$ 70`)

### Execução

```bash
# 1. Criar 2 pedidos (1 por estab) — frontend faz isso transparente
ORDER_1=$(curl -X POST 'https://staging-api.../orders' -d '{
  "establishment_id":"e1111111-...",
  "items":[{"product_id":"p1","qty":1,"unit_price_cents":3000}]
}' | jq -r '.id')

ORDER_2=$(curl -X POST 'https://staging-api.../orders' -d '{
  "establishment_id":"e2222222-...",
  "items":[{"product_id":"p2","qty":1,"unit_price_cents":4000}]
}' | jq -r '.id')

# 2. Checkout multi-split (1 preference, 2 splits)
SPLIT_RESP=$(curl -X POST 'https://staging.../functions/v1/mercadopago-multi-split-v2' \
  -d "{\"order_ids\":[\"$ORDER_1\",\"$ORDER_2\"]}")

# 3. Pagar via Pix sandbox (1 transação, R$ 70)
# 4. Conferir splits
psql -c "SELECT order_id, amount_cents, escrow_state FROM payment_split_items"
# Esperado: 2 rows, R$ 30 e R$ 40, ambos held
```

### Critérios de sucesso

| Check | Esperado |
|-------|----------|
| `payment_splits` count | 1 (1 preference) |
| `payment_split_items` count | 2 (1 por estab) |
| Cada split com `escrow_state=held` | sim |
| Total = soma dos itens | `R$ 70,00` |
| Após D+7: 2 PIX transfers separados | 1 pra cada estab |

---

## 5.6 — Revenda (cliente compra, repassa para amigo)

**Objetivo**: validar comportamento esperado. **Decisão de produto pendente**:
o pedido é transferível? Se sim, com taxa? Se não, qual mensagem mostra?

### Estado atual (a confirmar com owner)

- **Hipótese A**: pedidos NÃO são transferíveis. O nome no pedido é fixo no
  momento do checkout. Se cliente quer dar de presente, gera segundo pedido.
- **Hipótese B**: pedido tem campo `transferable` opcional. Se `true`, gera
  link público `/pedido/<id>/aceitar` que outro user pode aceitar. Cobra
  taxa de transferência (ex: 2%).

### Teste sugerido (Hipótese A)

```bash
# 1. Cliente A faz pedido + paga
ORDER_A=$(criar pedido em nome de Cliente A)
# Pagar...

# 2. Tentativa de "transferir" — frontend deve impedir
# Confirmar: não há endpoint de transferência implementado.

# 3. Workflow correto: cancelar A + criar B
# (5.3 já cobre cancelamento)
```

### Status

- Decisão de produto pendente do owner (hipótese A vs B).
- Se A: tarefa é apenas documentar nos `/termos` que pedidos não são
  transferíveis. **Concluído sem implementação adicional**.
- Se B: requer feature nova (`POST /orders/:id/transfer-link` + UX).

---

## Como executar a suite completa

```bash
# 1. Reset banco staging (cuidado: apaga dados de testes anteriores)
psql -f supabase/seeds/reset-staging.sql

# 2. Rodar 5.1 → 5.3 → 5.5 nessa ordem (5.1 é dependência das outras)
# Cada passo manual; ~15min total se MP sandbox responder rápido.

# 3. Anotar resultado em docs/PAYMENT-TESTS-LOG.md (criar)
# Formato: data, cenário, resultado (PASS/FAIL/SKIP), evidências (curl + screenshot)
```

## Status (2026-05-08)

| Item | Playbook | Execução real |
|------|----------|--------------|
| 5.1 | ✅ documentado | ⏳ pendente (MP creds owner) |
| 5.3 | ✅ documentado | ⏳ pendente |
| 5.5 | ✅ documentado | ⏳ pendente |
| 5.6 | ✅ documentado (com decisão de produto pendente) | ⏳ |

Items marcados **in_progress** no roadmap até execução real comprovada.
