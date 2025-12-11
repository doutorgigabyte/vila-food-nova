import { useState, useEffect } from "react";
import { Check, CheckCheck, Send, ShoppingCart, Image as ImageIcon } from "lucide-react";

interface Message {
  id: number;
  from: "customer" | "ai";
  type: "text" | "product" | "buttons";
  content?: string;
  product?: {
    name: string;
    price: string;
    description: string;
    emoji: string;
  };
  buttons?: string[];
  time: string;
}

const MOCK_CONVERSATION: Message[] = [
  {
    id: 1,
    from: "customer",
    type: "text",
    content: "Oi! Quero fazer um pedido 🍕",
    time: "14:32",
  },
  {
    id: 2,
    from: "ai",
    type: "text",
    content: "Olá! 👋 Bem-vindo à Pizzaria do Mário! Como posso ajudar?",
    time: "14:32",
  },
  {
    id: 3,
    from: "customer",
    type: "text",
    content: "Quero ver a pizza mais vendida",
    time: "14:33",
  },
  {
    id: 4,
    from: "ai",
    type: "product",
    product: {
      name: "Pizza Margherita",
      price: "R$ 45,00",
      description: "Molho de tomate, mussarela, manjericão fresco e azeite",
      emoji: "🍕",
    },
    time: "14:33",
  },
  {
    id: 5,
    from: "ai",
    type: "buttons",
    content: "Deseja adicionar ao carrinho?",
    buttons: ["✅ Adicionar", "📋 Ver mais opções"],
    time: "14:33",
  },
];

const WhatsAppSimulation = () => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= MOCK_CONVERSATION.length) {
      // Reset after showing all
      const resetTimeout = setTimeout(() => {
        setVisibleMessages([]);
        setCurrentIndex(0);
      }, 3000);
      return () => clearTimeout(resetTimeout);
    }

    const nextMessage = MOCK_CONVERSATION[currentIndex];
    
    if (nextMessage.from === "ai") {
      // Show typing indicator for AI messages
      setIsTyping(true);
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages((prev) => [...prev, nextMessage]);
        setCurrentIndex((i) => i + 1);
      }, 1200);
      return () => clearTimeout(typingTimeout);
    } else {
      // Customer messages appear instantly
      const messageTimeout = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, nextMessage]);
        setCurrentIndex((i) => i + 1);
      }, 800);
      return () => clearTimeout(messageTimeout);
    }
  }, [currentIndex]);

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      {/* WhatsApp Header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-[#1f2c34]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-lg">🍕</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">Pizzaria do Mário</p>
          <p className="text-emerald-400 text-xs">online • IA ativa</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[10px]">24/7</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"%3E%3Cg fill-opacity=\"0.05\"%3E%3Cpath fill=\"%2325D366\" d=\"M0 0h100v100H0z\"/%3E%3C/g%3E%3C/svg%3E')" }}>
        {visibleMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === "customer" ? "justify-end" : "justify-start"} animate-fade-up`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                msg.from === "customer"
                  ? "bg-[#005c4b] rounded-tr-none"
                  : "bg-[#1f2c34] rounded-tl-none"
              }`}
            >
              {msg.type === "text" && (
                <p className="text-white text-sm">{msg.content}</p>
              )}

              {msg.type === "product" && msg.product && (
                <div className="space-y-2">
                  {/* Product image placeholder */}
                  <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <span className="text-6xl">{msg.product.emoji}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{msg.product.name}</p>
                    <p className="text-white/70 text-xs">{msg.product.description}</p>
                    <p className="text-emerald-400 font-bold text-base mt-1">{msg.product.price}</p>
                  </div>
                </div>
              )}

              {msg.type === "buttons" && (
                <div className="space-y-2">
                  <p className="text-white text-sm">{msg.content}</p>
                  <div className="flex flex-col gap-1.5">
                    {msg.buttons?.map((btn, i) => (
                      <button
                        key={i}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          i === 0
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/10 text-white/80 border border-white/20"
                        }`}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time and status */}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-white/50">{msg.time}</span>
                {msg.from === "customer" && (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-up">
            <div className="bg-[#1f2c34] rounded-lg rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1f2c34]">
        <button className="p-2 text-white/50">
          <ImageIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
          <p className="text-white/40 text-sm">Mensagem...</p>
        </div>
        <button className="p-2 rounded-full bg-emerald-500">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

export default WhatsAppSimulation;
