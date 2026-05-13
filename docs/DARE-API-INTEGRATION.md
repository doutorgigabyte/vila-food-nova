# Integração Vila Food ↔ Daré API Gateway

> **Status**: Documentação de implementação. As edge functions já estão deployadas no Smart Guide Supabase.
> **Última atualização**: 2026-05-12
> **Repositório de origem**: `tamandare-smart-guide` (Smart Guide / Localizai backend)

---

## 0. TL;DR (5 linhas pra entender)

1. A "Daré IA" é um conjunto de **edge functions Deno** no Supabase do Smart Guide (Localizai).
2. O Vila Food chama essas funções via HTTPS — não precisa instalar nada, é API REST.
3. Auth = Bearer JWT do usuário Smart Guide (precisa SSO ou conta unificada) **OU** modo público sem auth (a criar).
4. Os restaurantes do Vila Food **já** aparecem pro Daré via webhook bidirecional (`establishment-sync-from-vila-food`).
5. Falta: chamar a API do Vila Food, adicionar domínio do Vila Food no CORS, escolher estratégia de auth.

---

## 1. Endpoints disponíveis

Base URL (produção self-hosted no Coolify):
```
https://api.supabasekong-bm30vj8tm3qze7pgi61ogai3.185.100.215.206.sslip.io/functions/v1
```

> Quando o domínio fixo do Smart Guide for definido (ex: `api.tamandare.app` ou `dare.api`), troca aqui.

| Endpoint | Método | Pra quê | Auth |
|---|---|---|---|
| `/dare-realtime` | POST | **Chat conversacional principal**. System prompt com persona Daré (sotaque PE), 4 ferramentas: searchPlaces, getEvents, getNews, createItinerary. | Bearer JWT |
| `/generate-itinerary` | POST | Gera roteiro estruturado JSON (Gemini 2.5 Flash). Aceita duração, interesses, orçamento. | Bearer JWT |
| `/ai-assistant` | POST | Assistente AI mais genérico (sem persona forte). | Bearer JWT |
| `/smart-recommendations` | POST | Recomendações baseadas em contexto (localização, hora, tags). | Bearer JWT |
| `/dare-voice` | POST | TTS — gera áudio do Daré falando o texto. Retorna URL S3. | Bearer JWT |
| `/dare-wallet-status` | GET | Saldo da carteira Daré do usuário (créditos consumidos vs limite). | Bearer JWT |
| `/dare-wallet-consume` | POST | Debita crédito (uma chamada = N créditos). Chamado **dentro** das outras funções. | Service role |
| `/weather-tides` | GET | Clima + maré em tempo real (open CORS, sem auth). | — |
| `/bus-schedules` | GET | Horários de ônibus locais (open CORS, sem auth). | — |

---

## 2. Variáveis de ambiente a adicionar no Vila Food

No `.env` (e `.env.example`) do `vila-food-nova`:

```bash
# ===== Daré API Gateway (Smart Guide) =====
# Base URL das edge functions do Smart Guide. Em dev pode apontar pro
# Coolify direto (sslip.io); em prod, dominio fixo quando definido.
VITE_DARE_API_BASE_URL="https://api.supabasekong-bm30vj8tm3qze7pgi61ogai3.185.100.215.206.sslip.io/functions/v1"

# Anon key do SMART GUIDE Supabase (nao confundir com VITE_SUPABASE_PUBLISHABLE_KEY,
# que e a do banco do proprio Vila Food).
# Pegar no Coolify > supabase-bm30vj8tm3qze7pgi61ogai3 > Environment Variables > ANON_KEY
VITE_DARE_ANON_KEY="<smart guide anon key>"

# Flag pra ativar o widget do Dare no Vila Food. Default off ate a integracao
# estar testada em staging.
VITE_DARE_ENABLED="false"
```

> **Importante**: a `VITE_DARE_ANON_KEY` é uma chave **pública** (anon JWT do Postgres do Smart Guide). É segura no bundle do client. O que **não** pode aparecer no client é a `SERVICE_ROLE_KEY` — essa fica só nas edge functions.

---

## 3. Cliente HTTP — arquivo a criar

**Caminho**: `src/integrations/dare-api/client.ts`

```typescript
/**
 * Cliente HTTP pro Dare API Gateway (Smart Guide edge functions).
 *
 * Auth: passa o JWT do usuario logado no Smart Guide. Se Vila Food e Smart
 * Guide compartilharem o mesmo issuer (mesma instancia Supabase Auth), o
 * token do usuario logado no Vila Food vale aqui tambem. Caso contrario,
 * precisa SSO via OAuth ou exchange de token (ver secao 7).
 */
import { supabase } from '@/integrations/supabase/client';

const DARE_API_BASE_URL = import.meta.env.VITE_DARE_API_BASE_URL as string;
const DARE_ANON_KEY = import.meta.env.VITE_DARE_ANON_KEY as string;

if (!DARE_API_BASE_URL) {
  console.warn('[dare-api] VITE_DARE_API_BASE_URL nao configurado — modo offline.');
}

export interface DareMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DareChatRequest {
  messages: DareMessage[];
  language?: 'pt-BR' | 'en-US' | 'es-ES';
  stream?: boolean;
  /** Contexto do app caller (vila_food, rota_tamandare, etc) */
  context?: {
    app: 'vila_food';
    /** Restaurante atualmente sendo visualizado, se houver */
    establishment_id?: string;
    /** Carrinho atual */
    cart_items?: Array<{ name: string; quantity: number }>;
    /** Localizacao do usuario (lat/lng) */
    user_location?: [number, number];
  };
}

export interface DareChatResponse {
  response: string;
  /** Tools chamadas pelo Dare durante a resposta */
  tool_calls?: Array<{ name: string; result: unknown }>;
  /** Creditos consumidos nesta chamada */
  credits_used?: number;
}

/**
 * Chama o endpoint principal do Dare (chat com persona + tools).
 *
 * Throws:
 *   - DareAuthError se 401 (token invalido ou ausente)
 *   - DareCorsError se navegador bloqueou
 *   - Error generico em outros casos
 */
export async function dareChat(req: DareChatRequest): Promise<DareChatResponse> {
  if (!DARE_API_BASE_URL) {
    throw new Error('Dare API nao configurada — verifique VITE_DARE_API_BASE_URL');
  }

  // Pega JWT do usuario logado no Vila Food (assumindo Auth compartilhada
  // ou SSO ja feito). Fallback pra anon key se nao houver sessao — isso
  // limita o que o Dare retorna (ver endpoint que aceita anon).
  const { data: { session } } = await supabase.auth.getSession();
  const bearer = session?.access_token || DARE_ANON_KEY;

  const res = await fetch(`${DARE_API_BASE_URL}/dare-realtime`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearer}`,
      // apikey header tambem e exigido pelo Supabase API gateway (Kong)
      'apikey': DARE_ANON_KEY,
    },
    body: JSON.stringify({
      messages: req.messages,
      language: req.language ?? 'pt-BR',
      stream: req.stream ?? false,
      context: req.context,
    }),
  });

  if (res.status === 401) {
    throw new DareAuthError('Sessao expirada ou nao autenticada. Faz login.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Dare API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

/**
 * Gera roteiro estruturado (nao conversacional). Util pra fluxos batch
 * tipo "monta minha viagem de 3 dias".
 */
export interface DareItineraryRequest {
  days: number;
  travelers: { adults: number; children: number };
  budget?: 'low' | 'mid' | 'high';
  interests?: string[];
  start_date?: string; // ISO YYYY-MM-DD
}

export async function dareGenerateItinerary(req: DareItineraryRequest) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new DareAuthError('Login obrigatorio pra gerar roteiro.');

  const res = await fetch(`${DARE_API_BASE_URL}/generate-itinerary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': DARE_ANON_KEY,
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`generate-itinerary ${res.status}`);
  return res.json();
}

/**
 * Status da carteira Dare do usuario (creditos disponiveis, limite mensal).
 */
export async function dareWalletStatus() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const res = await fetch(`${DARE_API_BASE_URL}/dare-wallet-status`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': DARE_ANON_KEY,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export class DareAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DareAuthError';
  }
}

export class DareCorsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DareCorsError';
  }
}
```

---

## 4. Hook React pra usar no UI

**Caminho**: `src/hooks/useDareChat.ts`

```typescript
import { useState, useCallback } from 'react';
import { dareChat, DareMessage, DareChatRequest } from '@/integrations/dare-api/client';

export function useDareChat(initialContext?: DareChatRequest['context']) {
  const [messages, setMessages] = useState<DareMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (userText: string) => {
    const newUserMsg: DareMessage = { role: 'user', content: userText };
    setMessages(m => [...m, newUserMsg]);
    setLoading(true);
    setError(null);

    try {
      const res = await dareChat({
        messages: [...messages, newUserMsg],
        context: initialContext,
      });
      setMessages(m => [...m, { role: 'assistant', content: res.response }]);
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [messages, initialContext]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, reset };
}
```

---

## 5. Componente de UI — widget de chat

**Caminho sugerido**: `src/components/dare/DareChatWidget.tsx`

Exemplo mínimo (usa shadcn/ui que já está no Vila Food):

```tsx
import { useState } from 'react';
import { Sparkles, Send, X } from 'lucide-react';
import { useDareChat } from '@/hooks/useDareChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  /** Restaurante sendo visualizado (vai pro contexto do Dare) */
  establishmentId?: string;
  /** Posicionamento do botao flutuante */
  position?: 'bottom-right' | 'bottom-left';
}

export function DareChatWidget({ establishmentId, position = 'bottom-right' }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, error, send } = useDareChat({
    app: 'vila_food',
    establishment_id: establishmentId,
  });

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    try {
      await send(text);
    } catch {
      // erro ja capturado no hook
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className={`fixed ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} 
                   z-50 rounded-full shadow-lg`}
        size="lg"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Falar com Dare
      </Button>
    );
  }

  return (
    <div className={`fixed ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} 
                    z-50 w-96 h-[500px] bg-background border rounded-2xl shadow-2xl flex flex-col`}>
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-bold">Dare — IA local de Tamandare</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Oxe, manda ai! Posso recomendar restaurante, montar roteiro ou tirar duvida sobre Tamandare.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${
              m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-muted-foreground italic">Dare digitando...</p>}
        {error && <p className="text-sm text-destructive">Erro: {error}</p>}
      </ScrollArea>

      <footer className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Pergunta pro Dare..."
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
```

Pra ativar no app, em `App.tsx` (ou layout principal):

```tsx
import { DareChatWidget } from '@/components/dare/DareChatWidget';

// dentro do return:
{import.meta.env.VITE_DARE_ENABLED === 'true' && <DareChatWidget />}
```

---

## 6. Liberar CORS no Smart Guide

**Bloqueio atual**: as edge functions usam `restrictedCorsHeaders` que lê `ALLOWED_ORIGIN` env var. Default = `http://localhost:8080`. Em produção, só aceita um domínio.

**O que fazer no Coolify do Smart Guide** (`supabase-bm30vj8tm3qze7pgi61ogai3`):

1. Vai em **Environment Variables** do serviço `supabase-edge-functions`
2. Adiciona/altera:
   ```
   ALLOWED_ORIGIN=https://vilafood.delivery,https://app.vilafood.delivery,https://rota.tamandare.app
   ```
3. Restart do serviço

> **Limitação**: a função `restrictedCorsHeaders` em `_shared/cors.ts` retorna **um único** valor no header `Access-Control-Allow-Origin`. CORS spec não aceita lista separada por vírgula direto. Precisa refatorar pra ler o `Origin` da request e responder com o origin permitido se estiver na whitelist.

**Patch necessário em `_shared/cors.ts`**:

```typescript
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:8080")
  .split(",")
  .map(s => s.trim());

export function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
```

E em cada edge function que importa `restrictedCorsHeaders`, trocar pra `buildCorsHeaders(req)`.

---

## 7. Estratégia de autenticação

### Opção A (recomendada): SSO via Supabase Auth compartilhada

**Pré-requisito**: Vila Food e Smart Guide usam a **mesma** instância de Supabase Auth. Hoje **não** é o caso — cada um tem sua própria.

**Como fazer**:
1. Eleger UM Supabase como provedor de identidade (sugiro **Smart Guide**, que já tem mais users e Daré Wallet).
2. Vila Food deixa de criar users no próprio Auth — passa a chamar `https://api.supabasekong-bm30vj8tm3qze7pgi61ogai3.../auth/v1/signup` e `.../auth/v1/token`.
3. O JWT que o Vila Food recebe já vale pras edge functions do Smart Guide (mesma chave de assinatura).
4. Tabelas de usuário do Vila Food (`user_profile`, `cart`, etc) passam a referenciar `auth.users.id` do Smart Guide via webhook ou foreign data wrapper.

### Opção B (mais rápida): Token exchange

**Como fazer**:
1. Vila Food autentica user no próprio Supabase Auth.
2. Cria edge function `vila-food-to-dare-token` no **Vila Food** Supabase: valida JWT do Vila Food, retorna um JWT assinado com chave compartilhada com Smart Guide.
3. Vila Food envia esse JWT pras chamadas do Daré.

Mais complexo de manter mas não exige migrar Auth.

### Opção C (gambiarra temporária): modo público sem auth

**Como fazer**:
1. Criar um endpoint novo `/dare-realtime-public` no Smart Guide que aceita anon key sem validação de `auth.users`.
2. Limita a 10 requests/min por IP (rate limit).
3. Sem persistir histórico no banco do Smart Guide (passa em memória só).

Adequado pra MVP/landing. Não rastrea quem é o user → não dá pra cobrar carteira Daré.

---

## 8. Verificar que sync Vila Food → Smart Guide está vivo

**Checagem rápida no Smart Guide Supabase** (via psql ou SQL Editor):

```sql
-- Ultimas 10 mudancas de restaurante que vieram do Vila Food
SELECT
  event_type,
  establishment_id,
  occurred_at,
  payload->>'name' AS name
FROM core.establishment_sync_log
ORDER BY occurred_at DESC
LIMIT 10;

-- Cursor atual da sincronizacao (eventos processados)
SELECT * FROM core.establishment_sync_state;

-- Eventos pendentes no outbox do Vila Food (rodar no banco do Vila Food)
SELECT COUNT(*) AS pendentes
FROM public.establishment_outbox
WHERE delivered_at IS NULL;
```

**Se sync estiver parado**:

1. Verifica `pg_cron` no Vila Food: `SELECT * FROM cron.job WHERE jobname LIKE '%outbox%';`
2. Logs do cron: `SELECT * FROM cron.job_run_details WHERE jobname LIKE '%outbox%' ORDER BY end_time DESC LIMIT 20;`
3. Logs da edge function: Coolify > supabase-bm30vj8tm3qze7pgi61ogai3 > Logs > filtrar por `establishment-sync-from-vila-food`

---

## 9. Endpoints públicos (não precisam auth, pode chamar direto)

Estes funcionam com `apikey` header e sem Bearer JWT — ideais pra widgets/banners no Vila Food:

| Endpoint | Retorna |
|---|---|
| `GET /weather-tides` | `{ temp_c, condition, tide_today: [...] }` — pra mostrar "vai chover hoje?" antes do user pedir delivery |
| `GET /bus-schedules?from=tamandare&to=recife` | Próximos ônibus — útil pra delivery em Carneiros saber tempo de chegada |

CORS desses já é `*` (public). Não precisa configurar nada.

---

## 10. Checklist de implementação (ordem sugerida)

- [ ] **No Smart Guide**: aplicar patch CORS (`buildCorsHeaders` que aceita whitelist). Deploy via Coolify.
- [ ] **No Smart Guide**: adicionar `ALLOWED_ORIGIN` env var com domínios Vila Food.
- [ ] **No Vila Food**: adicionar 3 env vars (`VITE_DARE_API_BASE_URL`, `VITE_DARE_ANON_KEY`, `VITE_DARE_ENABLED`).
- [ ] **No Vila Food**: criar `src/integrations/dare-api/client.ts` (cliente HTTP).
- [ ] **No Vila Food**: criar `src/hooks/useDareChat.ts`.
- [ ] **No Vila Food**: criar `src/components/dare/DareChatWidget.tsx`.
- [ ] **No Vila Food**: montar widget no layout principal, gated por `VITE_DARE_ENABLED`.
- [ ] **Testar localmente**: `VITE_DARE_ENABLED=true bun dev` → abrir widget → mandar "tem comida nordestina?".
- [ ] **Decidir auth**: Opção A (SSO) pra produção; Opção C (público) pra preview/staging.
- [ ] **Validar sync**: rodar queries da seção 8 e confirmar que Daré "vê" estabelecimentos atualizados do Vila Food.
- [ ] **Deploy staging**: ativar flag em `app.staging.vilafood.delivery` e testar end-to-end.
- [ ] **Telemetria**: logar quantas chamadas/dia, latência p95, taxa de erro CORS/401.

---

## 11. Custos previstos (créditos Daré)

A `dare-wallet` cobra crédito a cada chamada. Tabela estimada:

| Endpoint | Créditos consumidos |
|---|---|
| `/dare-realtime` (1 mensagem) | 1 |
| `/dare-realtime` (com tool call) | 2 |
| `/generate-itinerary` | 5 |
| `/dare-voice` (TTS) | 3 |
| `/smart-recommendations` | 1 |
| `/weather-tides` | 0 (público) |

User free: 50 créditos/dia. Plano premium: 500/dia (a ser definido).

> Vila Food precisa decidir: cobra do user (cada chat = 1 crédito) ou bancado pelo restaurante parceiro (recurso premium do plano "Patrocinador" do lojista).

---

## 12. Contatos / next steps

- **Dúvida sobre Daré API**: olhar `tamandare-smart-guide/supabase/functions/dare-realtime/index.ts` (system prompt + tools).
- **Sync ↔ Vila Food**: olhar `tamandare-smart-guide/supabase/functions/establishment-sync-from-vila-food/index.ts`.
- **PRD da Rota Tamandaré (Phase III)**: `PRD-ROTA-TAMANDARE.md` no repo Rota-Tamandar-.
- **Issues abertos**: nenhum até 2026-05-12; criar tracking no GitHub se começar a implementar.

---

**Última nota**: essa integração não bloqueia o roadmap de venda do Rota Tamandaré. Vila Food pode ir com Opção C (público) pra começar a usar Daré como diferencial, e migrar pra SSO quando o user-base justificar a unificação de Auth.
