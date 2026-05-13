import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { useDareChat } from "@/hooks/useDareChat";
import { isDareConfigured } from "@/integrations/dare-api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DareChatWidgetProps {
  /**
   * Estabelecimento atualmente sendo visualizado. Vai pro contexto do Daré
   * pra ele saber sobre qual loja o cliente está perguntando.
   */
  establishmentId?: string;
  /** Posição do botão flutuante. */
  position?: "bottom-right" | "bottom-left";
  /** Saudação inicial mostrada quando o chat abre vazio. */
  greeting?: string;
}

const DEFAULT_GREETING =
  "Oxe, manda aí! Posso recomendar restaurante, montar roteiro ou tirar dúvida sobre Tamandaré.";

/**
 * Widget flutuante de chat com a IA Daré (Smart Guide).
 *
 * Renderiza nada se a integração não estiver configurada (sem env vars) —
 * isso evita botão quebrado em PRs preview ou builds locais sem secret.
 *
 * Para ativar globalmente, passe `VITE_DARE_ENABLED=true` no ambiente E
 * monte o componente no layout principal. Esses dois gates são separados
 * de propósito: a env vai por feature flag, o `isDareConfigured()` por
 * configuração mínima do backend.
 */
export function DareChatWidget({
  establishmentId,
  position = "bottom-right",
  greeting = DEFAULT_GREETING,
}: DareChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, loading, error, send } = useDareChat({
    greeting,
    context: {
      app: "vila_food",
      establishment_id: establishmentId,
    },
  });

  // Auto-scroll to bottom on every new message.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading]);

  if (!isDareConfigured()) return null;

  const handleSend = async () => {
    const text = input;
    if (!text.trim() || loading) return;
    setInput("");
    await send(text);
  };

  const positionClass = position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6";

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className={cn("fixed z-50 rounded-full shadow-lg gap-2", positionClass)}
        size="lg"
      >
        <Sparkles className="h-4 w-4" />
        Falar com Daré
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex w-[min(24rem,calc(100vw-3rem))] h-[min(32rem,calc(100vh-3rem))] flex-col rounded-2xl border bg-background shadow-2xl",
        positionClass,
      )}
      role="dialog"
      aria-label="Chat com Daré"
    >
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold leading-tight">Daré</p>
            <p className="text-xs text-muted-foreground">IA local de Tamandaré</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar chat">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="space-y-3 p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <p className="text-sm italic text-muted-foreground">Daré tá digitando…</p>
          )}
          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>

      <footer className="flex gap-2 border-t p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Pergunta pro Daré..."
          disabled={loading}
          aria-label="Mensagem"
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          size="icon"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
