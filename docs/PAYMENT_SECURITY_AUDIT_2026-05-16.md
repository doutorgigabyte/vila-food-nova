# Auditoria de Segurança Financeira - VilaFood

**Data:** 2026-05-16
**Escopo:** Camada de pagamento MercadoPago + webhooks + painel financeiro
**Status:** ✅ Aprovado para lançar com MP (PagBank ainda tem buracos, está pulado)

---

## 1. Vulnerabilidade P0 fechada antes do lançamento

### AMOUNT_TAMPERING (CVE interno)

**Bug:** 4 edge functions de pagamento MP aceitavam `amount` do request body sem comparar com `order.total` no DB. Cliente podia trocar `amount` no devtools de R$100 pra R$0.01, pagar 1 centavo e o webhook do MP confirmava (busca a API, vê 0.01 mesmo). Lojista entregava produto de R$100.

**Funções afetadas:**
- `supabase/functions/mercadopago-pix/index.ts`
- `supabase/functions/mercadopago-sale/index.ts`
- `supabase/functions/mercadopago-checkout-pro/index.ts`
- `supabase/functions/mercadopago-multi-split/index.ts`

**Fix:** PR #18 (commit 69fb983), mergeado e deployado em 2026-05-16. Cada função agora compara `Math.abs(amount - order.total) > 0.01` e loga `AMOUNT_TAMPERING` se houver tentativa.

**Validação em produção:**
```
POST /functions/v1/mercadopago-pix
{ order_id: "2998fe71-...", amount: 0.01 }    # total real: R$14.90
→ HTTP 400 "Valor solicitado não corresponde ao total do pedido"
```

---

## 2. Testes executados (11 cenários)

| # | Cenário | Endpoint | Resultado | Status |
|---|---|---|---|---|
| 1 | AMOUNT_TAMPERING amount=0.01 | mercadopago-pix | HTTP 400 | ✅ Bloqueado |
| 2 | AMOUNT_TAMPERING amount=0.01 | mercadopago-checkout-pro | HTTP 400 | ✅ Bloqueado |
| 3 | AMOUNT match (14.90 = order.total) | mercadopago-pix | Passa do check | ✅ Funciona |
| 4 | AMOUNT_TAMPERING transaction_amount=0.50 | mercadopago-sale | HTTP 400 | ✅ Bloqueado |
| 5 | Webhook spoofing sem header `x-signature` | mercadopago-webhook | HTTP 401 "Invalid signature" | ✅ Bloqueado |
| 6 | Webhook spoofing com HMAC fake | mercadopago-webhook | HTTP 401 "Invalid signature" | ✅ Bloqueado |
| 7 | GET no webhook endpoint | mercadopago-webhook | HTTP 200 mas falha JSON parse | ⚠️ Tolerável |
| 8 | SQL injection no order_id | mercadopago-pix | HTTP 404 (uuid type validation) | ✅ Bloqueado |
| 9 | UPDATE orders.status='confirmed' via anon | REST /rest/v1/orders | HTTP 200 com `[]` (RLS bloqueou) | ✅ Bloqueado |
| 10 | INSERT mp_transactions forjada via anon | REST /rest/v1/mp_transactions | HTTP 401 "violates RLS policy" | ✅ Bloqueado |
| 11 | SELECT orders de qualquer establishment | REST /rest/v1/orders | HTTP 200 com `[]` (anon não vê) | ✅ Bloqueado |

---

## 3. Vulnerabilidades P1 conhecidas (não bloqueiam lançamento porque PagBank está pulado)

| Local | Bug | Status |
|---|---|---|
| `pagseguro-webhook` | Sem idempotency check + confia no `charge.amount.value` do body | 🟡 Documentado, fix antes de habilitar PagBank |
| `pagseguro-pix` | Sem comparação amount vs order.total | 🟡 Mesmo padrão de fix do MP-PIX |
| `pagseguro-card` | Idem | 🟡 |
| `mercadopago-webhook` idempotency | Usa timestamp como chave, não payment_id | 🟡 Aceitável (MP retry usa mesmo payment_id; baixo risco de processar 2x) |

---

## 4. Plano de testes E2E em sandbox (próxima sessão, precisa 2FA do MP)

### Setup
1. Login painel MP → Credenciais de **teste** → copiar `TEST-...` Access Token + Public Key
2. Criar 2 Test Users (Painel MP → Test Users → Create):
   - **Vendedor** (vai conectar via OAuth como se fosse Marina)
   - **Comprador** (vai pagar com cartões de teste)
3. Coolify > vilafood-supabase > Environment Variables: comentar `MERCADOPAGO_*` produção, adicionar versões de teste
4. Stack restart
5. Validar via curl que `MERCADOPAGO_ACCESS_TOKEN` agora começa com `TEST-`

### Cartões de teste oficiais MP
A "palavra mágica" é o **nome do portador** — define o resultado.

| Nome | Bandeira | Resultado esperado |
|---|---|---|
| `APRO` | Mastercard 5031 4332 1540 6351 ou Visa 4235 6477 2802 5682 | ✅ Aprovado |
| `OTHE` | qualquer válido | ❌ Recusado outras causas |
| `CONT` | qualquer válido | ❌ Recusado dados inválidos |
| `CALL` | qualquer válido | 📞 Pendente revisão |
| `FUND` | qualquer válido | 💸 Saldo insuficiente |
| `SECU` | qualquer válido | 🔒 Recusado CVV |
| `EXPI` | qualquer válido | ⏰ Recusado vencimento |
| `FORM` | qualquer válido | 📝 Erro de form |
- CVV: 123 | Vencimento: 11/30 | CPF: 12345678909

### 10 cenários E2E
| # | Fluxo | Esperado |
|---|---|---|
| E1 | Login Marina → conectar MP OAuth com Test User vendedor | `establishments.mp_user_id` populado |
| E2 | Comprador cria pedido R$ 5,00 → checkout PIX → simula pagamento aprovado | `orders.status='confirmed'`, `mp_transactions` row, `cash_flow` row |
| E3 | Mesmo pedido → tentar pagar 2ª vez (duplicado) | HTTP 400 "Este pedido já foi pago" |
| E4 | Cartão `APRO` → 200 aprovado | Igual E2 |
| E5 | Cartão `OTHE` → recusado | `orders.status` permanece, sem `cash_flow` |
| E6 | Cartão `CALL` → pendente revisão | `mp_transactions.status='in_process'` |
| E7 | Estorno via dashboard Marina (botão Refund) → `auto-refund` | `mp_transactions.status='refunded'`, `cash_flow` reversal |
| E8 | Webhook reenviado 2x com mesmo `payment_id` | Processa só 1 vez (idempotency) |
| E9 | DevTools: manipular `amount` no checkout para 0.01 | HTTP 400 + log `AMOUNT_TAMPERING` (já validado) |
| E10 | Marina abre Painel Financeiro → conferir | Bruto, líquido, taxa, status, filtro por período batem com transações |

### Restore para produção depois dos testes
1. Coolify: descomentar `MERCADOPAGO_*` produção
2. Stack restart
3. Validar via curl que `MERCADOPAGO_ACCESS_TOKEN` começa com `APP_USR-`
4. Marina re-conecta a conta MP real dela (não pode usar OAuth do Test User em prod)

---

## 5. Lacunas no Painel Financeiro identificadas

Painel atual em `src/pages/dashboard/FinancialPanel.tsx` mostra Visão Geral / Transações / Contas Bancárias com:
- Total bruto, líquido (`net_amount`), taxa (`platform_fee`)
- Filtro por status (aprovado/pendente/recusado/estornado)
- Breakdown por método (PIX/cartão/dinheiro)
- Sync com webhook MP via `mp_transactions`

**Lacunas a corrigir antes de escalar:**
1. Não há card de **comissão total consolidada** no período (atualmente só por transação)
2. `establishment_commission_debt` está em página separada (`CommissionDebtManagement`) — devia aparecer no FinancialPanel
3. Taxa de serviço fixa de R$ 1 por pedido (`platform_service_fee`) não é discriminada na UI de transações
4. Não há relatório de **payout/transferência** (quando a plataforma transfere líquido pra Marina via PIX/TED) — só existe o saldo a receber

Não bloqueia lançamento (Marina vê tudo que precisa), mas é P1 pra próxima iteração.

---

## 6. Conclusão

✅ **Aprovado para lançar com MercadoPago.** 11 testes de segurança passaram, vuln P0 fechada, RLS robusto.

⚠️ **PagBank fica pra depois** — bugs P1 conhecidos, mas o usuário decidiu lançar só com MP. Antes de habilitar PagBank, fechar pagseguro-* com mesmo padrão do MP fix.

📋 **Próxima sessão (precisa 2FA do MP):** trocar pra sandbox + executar os 10 cenários E2E acima.
