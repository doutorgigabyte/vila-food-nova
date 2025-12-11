import { useState, useEffect } from "react";
import { Plus, Minus, Trash2, CreditCard, QrCode, Banknote, Printer, X, Check } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

const MOCK_CART: CartItem[] = [
  { id: "1", name: "Pizza Margherita", price: 45, quantity: 1, emoji: "🍕" },
  { id: "2", name: "Coca-Cola 2L", price: 12, quantity: 2, emoji: "🥤" },
  { id: "3", name: "Batata Frita G", price: 18, quantity: 1, emoji: "🍟" },
];

const PDVSimulation = () => {
  const [cart, setCart] = useState<CartItem[]>(MOCK_CART);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Simulate payment flow
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      const payments = ["pix", "card", "cash"];
      const randomPayment = payments[Math.floor(Math.random() * payments.length)];
      setSelectedPayment(randomPayment);
      
      setTimeout(() => {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedPayment(null);
        }, 1500);
      }, 1500);
    }, 5000);

    return () => clearInterval(cycleInterval);
  }, []);

  // Auto update quantities
  useEffect(() => {
    const interval = setInterval(() => {
      setCart((prev) => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        const newCart = [...prev];
        if (Math.random() > 0.5 && newCart[randomIndex].quantity < 5) {
          newCart[randomIndex].quantity += 1;
        }
        return newCart;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div>
          <h3 className="text-white font-semibold text-sm">PDV - Balcão</h3>
          <p className="text-emerald-400 text-xs">Caixa aberto • R$ 2.450,00</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-zinc-800 rounded-lg">
            <Printer className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800"
            >
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                <p className="text-white/50 text-xs">
                  R$ {item.price.toFixed(2)} un.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 bg-zinc-800 rounded-lg hover:bg-zinc-700">
                  <Minus className="w-3 h-3 text-white/60" />
                </button>
                <span className="text-white font-bold text-sm w-6 text-center">{item.quantity}</span>
                <button className="p-1.5 bg-primary/20 rounded-lg hover:bg-primary/30">
                  <Plus className="w-3 h-3 text-primary" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-sm">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick add buttons */}
        <div className="px-3 pb-3">
          <p className="text-white/40 text-xs mb-2">Adicionar rápido</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["🍕 Pizza", "🍔 Burger", "🥤 Bebida", "🍟 Porção"].map((item) => (
              <button
                key={item}
                className="flex-shrink-0 px-3 py-2 bg-zinc-800 rounded-lg text-white text-xs hover:bg-zinc-700"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment section */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-3 space-y-3">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Total ({cart.reduce((a, i) => a + i.quantity, 0)} itens)</span>
          <span className="text-white font-bold text-2xl">R$ {total.toFixed(2)}</span>
        </div>

        {/* Payment methods */}
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              selectedPayment === "pix"
                ? "border-teal-500 bg-teal-500/20"
                : "border-zinc-700 bg-zinc-800"
            }`}
          >
            <QrCode className="w-5 h-5 text-teal-400" />
            <span className="text-white text-xs">PIX</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              selectedPayment === "card"
                ? "border-purple-500 bg-purple-500/20"
                : "border-zinc-700 bg-zinc-800"
            }`}
          >
            <CreditCard className="w-5 h-5 text-purple-400" />
            <span className="text-white text-xs">Cartão</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              selectedPayment === "cash"
                ? "border-emerald-500 bg-emerald-500/20"
                : "border-zinc-700 bg-zinc-800"
            }`}
          >
            <Banknote className="w-5 h-5 text-emerald-400" />
            <span className="text-white text-xs">Dinheiro</span>
          </button>
        </div>

        {/* Finalize button */}
        <button className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
          showSuccess
            ? "bg-emerald-500 text-white"
            : "bg-gradient-to-r from-primary to-accent text-primary-foreground"
        }`}>
          {showSuccess ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Venda Finalizada!
            </span>
          ) : (
            "Finalizar Venda"
          )}
        </button>
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center animate-fade-up">
          <div className="p-4 bg-emerald-500 rounded-full">
            <Check className="w-12 h-12 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PDVSimulation;
