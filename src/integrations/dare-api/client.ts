/**
 * Cliente HTTP pro Daré API Gateway (edge functions Deno do Smart Guide).
 *
 * Auth strategy hoje: passa o JWT do usuário logado no Vila Food. Se Smart
 * Guide e Vila Food NÃO compartilham o mesmo issuer (cenário atual em maio
 * 2026), o backend do Smart Guide vai precisar:
 *   - aceitar o endpoint público (`dare-realtime-public`) — Opção C do doc, OU
 *   - implementar token exchange (Opção B), OU
 *   - migrar Auth pra ser compartilhada (Opção A, recomendada longo prazo).
 *
 * Sem auth válida (e sem endpoint público), todas as chamadas vão dar 401.
 * Por isso o widget é gated por VITE_DARE_ENABLED — só liga quando o lado
 * Smart Guide estiver pronto.
 *
 * Detalhes completos em docs/DARE-API-INTEGRATION.md.
 */
import { supabase } from "@/integrations/supabase/client";

const DARE_API_BASE_URL = (import.meta.env.VITE_DARE_API_BASE_URL as string) || "";
const DARE_ANON_KEY = (import.meta.env.VITE_DARE_ANON_KEY as string) || "";

export interface DareMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface DareChatContext {
  app: "vila_food";
  /** Estabelecimento que o cliente está visualizando, se houver. */
  establishment_id?: string;
  /** Carrinho atual (resumido). */
  cart_items?: Array<{ name: string; quantity: number }>;
  /** Localização do usuário (lat, lng). */
  user_location?: [number, number];
}

export interface DareChatRequest {
  messages: DareMessage[];
  language?: "pt-BR" | "en-US" | "es-ES";
  stream?: boolean;
  context?: DareChatContext;
}

export interface DareChatResponse {
  response: string;
  /** Tools chamadas pela IA durante a resposta. */
  tool_calls?: Array<{ name: string; result: unknown }>;
  /** Créditos consumidos nesta chamada (Daré Wallet). */
  credits_used?: number;
}

export interface DareItineraryRequest {
  days: number;
  travelers: { adults: number; children: number };
  budget?: "low" | "mid" | "high";
  interests?: string[];
  /** ISO YYYY-MM-DD. */
  start_date?: string;
}

export interface DareWalletStatus {
  credits_used_today: number;
  daily_limit: number;
  plan: "free" | "premium" | string;
}

export class DareAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DareAuthError";
  }
}

export class DareConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DareConfigError";
  }
}

export class DareCorsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DareCorsError";
  }
}

/**
 * True se a integração tem as envs mínimas configuradas. Use no UI pra
 * esconder componentes que dependem do Daré quando rodando em ambiente
 * sem configuração (ex: PR preview sem secrets).
 */
export function isDareConfigured(): boolean {
  return Boolean(DARE_API_BASE_URL && DARE_ANON_KEY);
}

async function getBearer(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || DARE_ANON_KEY;
}

function ensureConfigured() {
  if (!DARE_API_BASE_URL) {
    throw new DareConfigError(
      "VITE_DARE_API_BASE_URL não configurada — veja docs/DARE-API-INTEGRATION.md",
    );
  }
  if (!DARE_ANON_KEY) {
    throw new DareConfigError(
      "VITE_DARE_ANON_KEY não configurada — pegar no Coolify do Smart Guide",
    );
  }
}

async function dareFetch(
  path: string,
  init: { method?: string; body?: unknown; requireAuth?: boolean } = {},
): Promise<Response> {
  ensureConfigured();
  const bearer = await getBearer();

  let res: Response;
  try {
    res = await fetch(`${DARE_API_BASE_URL}${path}`, {
      method: init.method || "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
        apikey: DARE_ANON_KEY,
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch (err) {
    // fetch lança TypeError quando o navegador bloqueia por CORS antes de
    // chegar no servidor. Converte pra erro tipado pra UI tratar.
    if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
      throw new DareCorsError(
        "Navegador bloqueou a chamada (CORS). Verifique se o domínio atual está em ALLOWED_ORIGIN no Smart Guide.",
      );
    }
    throw err;
  }

  if (res.status === 401) {
    throw new DareAuthError(
      "Sessão expirada ou não autenticada no Daré. Faça login.",
    );
  }

  return res;
}

/**
 * Chat conversacional principal — endpoint `/dare-realtime`.
 * Persona "Daré" (sotaque pernambucano), com 4 tools: searchPlaces, getEvents,
 * getNews, createItinerary.
 */
export async function dareChat(req: DareChatRequest): Promise<DareChatResponse> {
  const res = await dareFetch("/dare-realtime", {
    method: "POST",
    body: {
      messages: req.messages,
      language: req.language ?? "pt-BR",
      stream: req.stream ?? false,
      context: req.context,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Daré API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<DareChatResponse>;
}

/**
 * Gera roteiro estruturado (JSON) — endpoint `/generate-itinerary`.
 * Não conversacional. Útil em fluxos batch tipo "monta minha viagem de 3 dias".
 */
export async function dareGenerateItinerary(req: DareItineraryRequest) {
  const res = await dareFetch("/generate-itinerary", {
    method: "POST",
    body: req,
    requireAuth: true,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`generate-itinerary ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

/**
 * Saldo da carteira Daré do usuário atual. Retorna null se sem sessão.
 */
export async function dareWalletStatus(): Promise<DareWalletStatus | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const res = await dareFetch("/dare-wallet-status", { method: "GET" });
    if (!res.ok) return null;
    return (await res.json()) as DareWalletStatus;
  } catch {
    return null;
  }
}
