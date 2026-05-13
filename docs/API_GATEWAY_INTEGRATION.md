# Integração com API Gateway (Doutor Gigabyte)

Este documento descreve como o VilaFood está integrado ao API Gateway centralizado e o que NÃO foi migrado (com justificativa).

## Visão geral

O API Gateway (`api-management-server`) recebe chamadas de todos os projetos via um único token e roteia para os providers reais (Gemini, OpenAI, Google Maps, Resend, etc.). Benefícios:

- 1 token por projeto ao invés de várias chaves
- Troca de provider sem mudar código (ex: Gemini → Claude pelo dashboard)
- Monitoramento de custo, latência e erros
- Fallback automático entre providers configurados no dashboard

## Estratégia: feature-flag com fallback

Cada função migrada verifica `GATEWAY_API_URL` + `GATEWAY_API_TOKEN`:

- **Configurado**: roteia pelo gateway. Se falhar (ou retornar 4xx/5xx), cai para o caminho legacy (Lovable AI / Resend / Google Maps direto).
- **Não configurado**: usa o caminho legacy diretamente.

Resultado: deploy seguro em produção sem precisar configurar o gateway antes. A migração pode ser ativada via secret quando o gateway estiver pronto.

## Configuração

Adicione como **secrets do Supabase** (não como `VITE_*`):

```
GATEWAY_API_URL=https://api.seuservidor.com
GATEWAY_API_TOKEN=giga_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Nunca exponha `GATEWAY_API_TOKEN` no frontend. Token deve ficar exclusivamente em edge functions (Deno).

No dashboard do gateway, o projeto "VilaFood" precisa ter ao menos estes providers configurados:

| Categoria | Provider | Modelo padrão sugerido |
|-----------|----------|------------------------|
| `llm` | gemini | gemini-2.0-flash (ou 2.5-flash, com suporte multimodal) |
| `maps` | google-maps | - |
| `email` | resend | - |

## Funções migradas (10)

Todas com fallback automático para o caminho original.

| Função | Categoria/Action | Fallback |
|--------|------------------|----------|
| `geocode-and-calculate-delivery` | `maps/geocode` | Google Maps direto |
| `send-password-reset` | `email/send` | SDK Resend |
| `ai-recommendations` | `llm/chat` | Lovable → Gemini direto → random |
| `ai-product-assistant` | `llm/chat` | Lovable direto |
| `analyze-establishment` | `llm/chat` | Lovable direto |
| `extract-customer-data` | `llm/chat` | Lovable direto |
| `analyze-image` | `llm/chat` (vision multimodal) | Lovable direto |
| `transcribe-audio` | `llm/chat` (audio multimodal) | Lovable direto |
| `whatsapp-ai-response` | `llm/chat` (com tool calling) | Lovable direto |
| `ai-health-check` | `llm/chat` (probe) | Mantém todos os checks legacy + adiciona probe gateway |

## Helper compartilhado

`supabase/functions/_shared/gateway.ts` expõe:

- `isGatewayEnabled()` — boolean síncrono
- `gatewayCall<T>(category, action, params)` — chamada genérica
- `gatewayLLMChat({ messages, model?, temperature?, maxTokens?, tools?, toolChoice? })` — suporta `content` string ou array multimodal `MultimodalContentPart[]` (text/image_url/audio)
- `gatewayChatAsOpenAIResponse(params)` — retorna um `Response` com schema OpenAI Chat Completions, drop-in para callers que faziam `fetch` para Lovable
- `gatewayGeocode({ address, language? })`
- `gatewayEmailSend({ from, to, subject, html, ... })`

Todos retornam `GatewayResponse<T>` com `success`, `data`, `error`, `statusCode`, `metadata`.

## Funções NÃO migradas — e por quê

### Pagamentos (Mercado Pago + PagBank, 14 funções)

`mercadopago-pix`, `mercadopago-webhook`, `mercadopago-oauth`, `mercadopago-sale`, `mercadopago-subscription`, `mercadopago-multi-split`, `mercadopago-affiliate-payout`, `mercadopago-point`, `mercadopago-checkout-pro`, `pagseguro-pix`, `pagseguro-card`, `pagseguro-oauth`, `pagseguro-webhook`, `auto-refund`.

**Motivo**: arquitetura multi-tenant incompatível com a abstração genérica do gateway:
- Cada estabelecimento tem seu próprio access token MP/PagBank no banco
- "Modelo Blindado" com split customizado (5% dos produtos para plataforma, 100% do frete para loja)
- Headers obrigatórios não documentados pelo gateway (`X-Idempotency-Key`, `X-meli-session-id` para device fingerprint)
- Webhooks bidirecionais com validação HMAC
- PagBank não tem provider no gateway

**O que seria preciso para migrar**: gateway precisa suportar (a) pass-through de access token por requisição, (b) headers customizados (idempotency + device id), (c) campo `additional_info.items` completo. Hoje a interface `payments.create` é genérica demais.

### WhatsApp / Evolution API (12 funções)

`evolution-api`, `whatsapp-webhook`, `whatsapp-ai-response` (parcialmente migrado para LLM, transport WhatsApp não), `whatsapp-cart`, `whatsapp-checkout`, `whatsapp-notification`, `whatsapp-order-notifications`, `whatsapp-send-media`, `whatsapp-send-product-photo`, `whatsapp-auth-code`, `whatsapp-auth-session`, `whatsapp-human-takeover`.

**Motivo**: arquitetura multi-tenant:
- Cada estabelecimento tem sua própria `instance_name` na Evolution API, com URL e API key específicas armazenadas em `whatsapp_instances`
- Há instância "system" para alertas globais (afiliados, manutenção) + instância por estabelecimento
- Templates de mensagem customizados com substituição de variáveis (`{{order_number}}`, `{{customer_name}}`, etc.)
- Webhooks recebem mensagens e roteiam via n8n para `whatsapp-ai-response`
- Polling com timeout de 5min para QR code

**O que seria preciso para migrar**: gateway suporta `messaging.whatsapp` apenas para uma instância configurada centralmente. Para nosso caso seria preciso suportar `instanceName` por requisição e múltiplas credenciais por projeto.

### iFood (2 funções)

`ifood-oauth`, `ifood-import-catalog` — sem provider no gateway.

### AWS S3 (2 funções)

`s3-upload`, `s3-delete` — sem provider no gateway. Implementação atual usa AWS SigV4 manualmente em Deno.

### Geração de imagem (3 funções)

- `generate-image` usa **Pollinations.ai** (gratuito, sem rate limit). Migrar para `image/generate` do gateway introduziria custo (DALL-E ~$0.04/img, Flux ~$0.04/img).
- `enhance-product-photo` (não existe ainda no repo, era spec).
- `fix-broken-images` usa URLs Unsplash hardcoded (não chama API externa).

### Funções sem API externa

`store-seo`, `generate-menu-json`, `apply-ai-improvements`, `calculate-delivery`, `auto-refund`, `partner-sync-from-rota`, `process-recurring-orders`, `register-customer`, `verify-auth-code`, `system-broadcast`, `migrate-*`, `sync-*`, `notify-merchant-order`, `security-anomaly-alert`, `create-team-member`, `reset-test-passwords`, `product-feeds`. Não possuem chamadas a APIs externas.

### Frontend Google Maps SDK

`src/components/maps/GoogleMap.tsx` continua usando `VITE_GOOGLE_MAPS_API_KEY` direto. O gateway é para **chamadas de API**; o JavaScript SDK do Google Maps carrega no browser e exige a chave pública restrita por HTTP referrer (per `RLS_AUDIT_2026-06-08.md`).

## Variáveis de ambiente

### Frontend (`.env.example`)
```
VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_PUBLISHABLE_KEY=""
VITE_SUPABASE_URL=""
VITE_GOOGLE_MAPS_API_KEY=""
```

### Backend (Supabase secrets) — opcionais para gateway
```
GATEWAY_API_URL=https://api.seuservidor.com
GATEWAY_API_TOKEN=giga_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Backend (Supabase secrets) — legacy (mantido como fallback)
- `LOVABLE_API_KEY` — Lovable AI Gateway (caminho legacy LLM)
- `GOOGLE_API_KEY` — Gemini direto + Maps server-side
- `RESEND_API_KEY` — Email
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_CLIENT_ID`, `MERCADOPAGO_CLIENT_SECRET`
- `PAGSEGURO_PLATFORM_ACCOUNT_ID`, `PAGSEGURO_ENVIRONMENT`, `PAGSEGURO_WEBHOOK_SECRET`, `PAGSEGURO_CLIENT_ID`, `PAGSEGURO_CLIENT_SECRET`
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
- `IFOOD_CLIENT_ID`, `IFOOD_CLIENT_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_REGION`, `AWS_CLOUDFRONT_URL`

## Como testar a integração

Sem os secrets `GATEWAY_*` configurados, tudo continua funcionando como antes. Para ativar:

1. No Supabase Dashboard → Settings → Edge Functions → Secrets, adicione `GATEWAY_API_URL` e `GATEWAY_API_TOKEN`.
2. No dashboard do gateway, cadastre o projeto "VilaFood" e configure os providers (`llm/gemini`, `maps/google-maps`, `email/resend`).
3. Invoque `ai-health-check` — deve retornar `api_gateway: { status: "ok" }`.
4. Faça um geocode de teste (qualquer pedido novo) — verifique nos logs `Gateway geocode failed` (se mal configurado) ou silêncio (sucesso).
5. No dashboard do gateway, confirme que requisições aparecem em `Logs` com o `projectId` correto e `latencyMs`.
6. Force uma falha temporária (token inválido) — fallback legacy deve ser acionado e função continuar respondendo.

## Próximos passos

Quando o time do gateway implementar:

1. **Multi-tenant credentials por requisição** → migrar pagamentos e WhatsApp.
2. **Pass-through de headers customizados** → migrar Mercado Pago.
3. **Provider PagBank** → migrar PagSeguro.
4. **Provider AWS S3** → migrar uploads.
5. **Provider iFood** → migrar import de catálogo.

Até lá, essas integrações continuam funcionando direto.
