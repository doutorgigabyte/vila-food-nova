// Cliente Deno para o API Gateway centralizado (Doutor Gigabyte).
// Se as variaveis de ambiente nao estiverem configuradas, retorna null e o
// chamador deve usar o caminho legacy (Lovable AI, Google Maps direto, Resend, etc).

export interface GatewayConfig {
  baseUrl: string;
  token: string;
}

export interface GatewayResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  provider?: string;
  latencyMs?: number;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

export function getGatewayConfig(): GatewayConfig | null {
  const baseUrl = Deno.env.get("GATEWAY_API_URL");
  const token = Deno.env.get("GATEWAY_API_TOKEN");
  if (!baseUrl || !token) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), token };
}

export function isGatewayEnabled(): boolean {
  return getGatewayConfig() !== null;
}

export async function gatewayCall<T = unknown>(
  category: string,
  action: string,
  params: Record<string, unknown>,
  options?: { timeoutMs?: number },
): Promise<GatewayResponse<T>> {
  const cfg = getGatewayConfig();
  if (!cfg) {
    return { success: false, error: "GATEWAY_NOT_CONFIGURED" };
  }

  const url = `${cfg.baseUrl}/api/v1/gateway/${category}/${action}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 30000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.token}`,
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: json?.error ?? `Gateway ${category}/${action} failed: ${response.status}`,
        statusCode: response.status,
      };
    }

    return json as GatewayResponse<T>;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown gateway error";
    return { success: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// LLM helpers
// ============================================================

// Conteudo multimodal compativel com OpenAI Chat API (image_url, audio).
// Passar direto via gateway para providers que suportam (Gemini, GPT-4V, Claude).
export type MultimodalContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } }
  | { type: "audio"; audio: { data: string; format: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | MultimodalContentPart[];
}

export interface ChatParams {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  tools?: unknown[];
  toolChoice?: unknown;
}

export interface ChatResponse {
  content: string;
  finishReason?: string;
  toolCalls?: unknown[];
  raw?: unknown;
}

export async function gatewayLLMChat(params: ChatParams): Promise<GatewayResponse<ChatResponse>> {
  return gatewayCall<ChatResponse>("llm", "chat", params as unknown as Record<string, unknown>);
}

// Helper para chamar o gateway esperando uma resposta no formato OpenAI Chat
// Completion (mesmo schema da Lovable AI). Retorna a Response inteira para
// que callers existentes possam usar `.ok`, `.status` e `.json()` sem mudar.
export async function gatewayChatAsOpenAIResponse(
  params: ChatParams,
): Promise<Response> {
  const result = await gatewayLLMChat(params);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: { message: result.error, code: result.statusCode } }),
      { status: result.statusCode ?? 502, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            role: "assistant",
            content: result.data?.content ?? "",
            tool_calls: result.data?.toolCalls,
          },
          finish_reason: result.data?.finishReason ?? "stop",
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

// ============================================================
// Maps helpers
// ============================================================

export interface GeocodeParams {
  address: string;
  language?: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
}

export async function gatewayGeocode(
  params: GeocodeParams,
): Promise<GatewayResponse<GeocodeResult>> {
  return gatewayCall<GeocodeResult>("maps", "geocode", params as unknown as Record<string, unknown>);
}

// ============================================================
// Email helpers
// ============================================================

export interface EmailSendParams {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export interface EmailSendResult {
  id: string;
}

export async function gatewayEmailSend(
  params: EmailSendParams,
): Promise<GatewayResponse<EmailSendResult>> {
  return gatewayCall<EmailSendResult>(
    "email",
    "send",
    params as unknown as Record<string, unknown>,
  );
}
