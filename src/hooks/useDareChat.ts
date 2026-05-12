import { useState, useCallback } from "react";
import {
  dareChat,
  DareAuthError,
  DareConfigError,
  DareCorsError,
  type DareMessage,
  type DareChatContext,
} from "@/integrations/dare-api/client";

interface UseDareChatOptions {
  context?: DareChatContext;
  /** Mensagem inicial do assistente (saudação). */
  greeting?: string;
}

interface UseDareChatReturn {
  messages: DareMessage[];
  loading: boolean;
  /** Mensagem de erro pronta pra mostrar no UI (ou null). */
  error: string | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook React pra conversar com o Daré.
 *
 * Mantém o histórico local de mensagens, envia tudo de uma vez pro endpoint
 * (o backend é responsável por manter contexto via system prompt + tools).
 *
 * Trata erros tipados do client e converte pra mensagens amigáveis em PT-BR.
 */
export function useDareChat(opts: UseDareChatOptions = {}): UseDareChatReturn {
  const [messages, setMessages] = useState<DareMessage[]>(() =>
    opts.greeting ? [{ role: "assistant", content: opts.greeting }] : [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: DareMessage = { role: "user", content: trimmed };
      // Snapshot for the network call so we don't depend on setState batching.
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setLoading(true);
      setError(null);

      try {
        const res = await dareChat({
          messages: nextHistory,
          context: opts.context,
        });
        setMessages((m) => [...m, { role: "assistant", content: res.response }]);
      } catch (err) {
        if (err instanceof DareConfigError) {
          setError("Daré não está configurado neste ambiente.");
        } else if (err instanceof DareAuthError) {
          setError("Você precisa estar logado pra falar com o Daré.");
        } else if (err instanceof DareCorsError) {
          setError(
            "Não conseguimos chamar o Daré daqui. Tente recarregar a página.",
          );
        } else {
          const msg = err instanceof Error ? err.message : "Erro desconhecido";
          setError(`Falha ao falar com o Daré: ${msg}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [messages, opts.context],
  );

  const reset = useCallback(() => {
    setMessages(opts.greeting ? [{ role: "assistant", content: opts.greeting }] : []);
    setError(null);
  }, [opts.greeting]);

  return { messages, loading, error, send, reset };
}
