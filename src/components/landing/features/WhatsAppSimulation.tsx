import { useState, useEffect } from "react";
import { CheckCheck, Send, Image as ImageIcon } from "lucide-react";

interface Message {
  id: number;
  from: "customer" | "ai";
  type: "text" | "product";
  content?: string;
  product?: {
    name: string;
    price: string;
    description: string;
    image: string;
  };
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
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop",
    },
    time: "14:33",
  },
  {
    id: 5,
    from: "ai",
    type: "text",
    content: "Essa é a nossa campeã de vendas! 🏆 Deseja adicionar ao carrinho?",
    time: "14:33",
  },
  {
    id: 6,
    from: "customer",
    type: "text",
    content: "Sim, pode adicionar!",
    time: "14:34",
  },
  {
    id: 7,
    from: "ai",
    type: "text",
    content: "Perfeito! Adicionado ao carrinho 🛒 Deseja mais alguma coisa ou posso fechar o pedido?",
    time: "14:34",
  },
];

const WhatsAppSimulation = () => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= MOCK_CONVERSATION.length) {
      const resetTimeout = setTimeout(() => {
        setVisibleMessages([]);
        setCurrentIndex(0);
      }, 3000);
      return () => clearTimeout(resetTimeout);
    }

    const nextMessage = MOCK_CONVERSATION[currentIndex];
    
    if (nextMessage.from === "ai") {
      setIsTyping(true);
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages((prev) => [...prev, nextMessage]);
        setCurrentIndex((i) => i + 1);
      }, 1200);
      return () => clearTimeout(typingTimeout);
    } else {
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
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#1f2c34]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-sm">🍕</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-xs truncate">Pizzaria do Mário</p>
          <p className="text-emerald-400 text-[10px]">online • IA ativa</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[9px]">24/7</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"%3E%3Cg fill-opacity=\"0.05\"%3E%3Cpath fill=\"%2325D366\" d=\"M0 0h100v100H0z\"/%3E%3C/g%3E%3C/svg%3E')" }}>
        {visibleMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === "customer" ? "justify-end" : "justify-start"} animate-fade-up`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-2 py-1.5 ${
                msg.from === "customer"
                  ? "bg-[#005c4b] rounded-tr-none"
                  : "bg-[#1f2c34] rounded-tl-none"
              }`}
            >
              {msg.type === "text" && (
                <p className="text-white text-[11px] leading-tight">{msg.content}</p>
              )}

              {msg.type === "product" && msg.product && (
                <div className="space-y-1.5">
                  {/* Product image */}
                  <div className="w-full aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={msg.product.image} 
                      alt={msg.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-[11px]">{msg.product.name}</p>
                    <p className="text-white/70 text-[10px] leading-tight">{msg.product.description}</p>
                    <p className="text-emerald-400 font-bold text-xs mt-0.5">{msg.product.price}</p>
                  </div>
                </div>
              )}

              {/* Time and status */}
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-[9px] text-white/50">{msg.time}</span>
                {msg.from === "customer" && (
                  <CheckCheck className="w-3 h-3 text-sky-400" />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-up">
            <div className="bg-[#1f2c34] rounded-lg rounded-tl-none px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#1f2c34]">
        <button className="p-1.5 text-white/50">
          <ImageIcon className="w-4 h-4" />
        </button>
        <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5">
          <p className="text-white/40 text-[10px]">Mensagem...</p>
        </div>
        <button className="p-1.5 rounded-full bg-emerald-500">
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default WhatsAppSimulation;
