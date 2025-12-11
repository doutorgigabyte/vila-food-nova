import { useState, useEffect } from "react";
import { Zap, Bike, Store, QrCode, CreditCard, Banknote, Check, Clock } from "lucide-react";

const PaymentSimulation = () => {
  const [selectedDelivery, setSelectedDelivery] = useState<"turbo" | "normal" | "pickup">("turbo");
  const [selectedPayment, setSelectedPayment] = useState<"pix" | "card" | "cash">("pix");
  const [showQR, setShowQR] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto cycle through options
  useEffect(() => {
    const deliveryOptions: ("turbo" | "normal" | "pickup")[] = ["turbo", "normal", "pickup"];
    let deliveryIndex = 0;

    const cycleInterval = setInterval(() => {
      deliveryIndex = (deliveryIndex + 1) % deliveryOptions.length;
      setSelectedDelivery(deliveryOptions[deliveryIndex]);
      setShowQR(false);
      setProgress(0);
    }, 4000);

    return () => clearInterval(cycleInterval);
  }, []);

  // Show QR code animation
  useEffect(() => {
    if (selectedPayment === "pix") {
      const timeout = setTimeout(() => setShowQR(true), 500);
      return () => clearTimeout(timeout);
    }
  }, [selectedPayment, selectedDelivery]);

  // QR code expiry progress
  useEffect(() => {
    if (showQR) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showQR]);

  const deliveryOptions = [
    {
      id: "turbo" as const,
      icon: Zap,
      label: "Turbo",
      time: "15 min",
      price: "R$ 12,49",
      color: "from-yellow-400 to-orange-500",
      badge: "Novo",
    },
    {
      id: "normal" as const,
      icon: Bike,
      label: "Rápida",
      time: "25-35 min",
      price: "R$ 8,49",
      color: "from-blue-400 to-blue-600",
    },
    {
      id: "pickup" as const,
      icon: Store,
      label: "Retirada",
      time: "20 min",
      price: "Grátis",
      color: "from-emerald-400 to-emerald-600",
    },
  ];

  const paymentOptions = [
    { id: "pix" as const, icon: QrCode, label: "PIX", color: "bg-teal-500" },
    { id: "card" as const, icon: CreditCard, label: "Cartão", color: "bg-purple-500" },
    { id: "cash" as const, icon: Banknote, label: "Dinheiro", color: "bg-emerald-500" },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <h3 className="text-white font-semibold text-sm">Finalizar Pedido</h3>
        <p className="text-white/50 text-xs">Escolha a entrega e pagamento</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Order summary mini */}
        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs">Resumo do pedido</span>
            <span className="text-white text-xs">3 itens</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white font-medium text-sm">Subtotal</span>
            <span className="text-white font-bold text-sm">R$ 89,00</span>
          </div>
        </div>

        {/* Delivery options */}
        <div>
          <p className="text-white/60 text-xs mb-2">Tipo de entrega</p>
          <div className="grid grid-cols-3 gap-2">
            {deliveryOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedDelivery(option.id)}
                className={`relative flex flex-col items-center p-3 rounded-xl border transition-all ${
                  selectedDelivery === option.id
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                {option.badge && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-yellow-500 text-black text-[8px] font-bold rounded-full">
                    {option.badge}
                  </span>
                )}
                <div className={`p-2 rounded-lg bg-gradient-to-br ${option.color} mb-1.5`}>
                  <option.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{option.label}</span>
                <span className="text-white/50 text-[10px]">{option.time}</span>
                <span className={`text-xs font-bold mt-0.5 ${option.id === "pickup" ? "text-emerald-400" : "text-white"}`}>
                  {option.price}
                </span>
                {selectedDelivery === option.id && (
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Payment options */}
        <div>
          <p className="text-white/60 text-xs mb-2">Forma de pagamento</p>
          <div className="flex gap-2">
            {paymentOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedPayment(option.id)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  selectedPayment === option.id
                    ? "border-primary bg-primary/10"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${option.color}`}>
                  <option.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PIX QR Code */}
        {selectedPayment === "pix" && showQR && (
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 animate-fade-up">
            <div className="text-center mb-3">
              <p className="text-white font-medium text-sm">Escaneie o QR Code</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400 text-xs">Expira em 10:00</span>
              </div>
            </div>
            
            {/* Fake QR Code */}
            <div className="relative mx-auto w-32 h-32 bg-white rounded-lg p-2">
              <div className="w-full h-full grid grid-cols-8 gap-0.5">
                {[...Array(64)].map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square ${Math.random() > 0.5 ? "bg-black" : "bg-white"}`}
                  />
                ))}
              </div>
              {/* Center logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PIX</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                style={{ width: `${100 - progress}%` }}
              />
            </div>

            <p className="text-center text-white/40 text-[10px] mt-2">
              Copiar código PIX
            </p>
          </div>
        )}

        {/* Total */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl p-4 border border-primary/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/60 text-xs">Taxa de entrega</span>
            <span className="text-white text-xs">
              {selectedDelivery === "pickup" ? "R$ 0,00" : selectedDelivery === "turbo" ? "R$ 12,49" : "R$ 8,49"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-base">Total</span>
            <span className="text-primary font-bold text-xl">
              R$ {selectedDelivery === "pickup" ? "89,00" : selectedDelivery === "turbo" ? "101,49" : "97,49"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer button */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <button className="w-full py-3 bg-gradient-to-r from-primary to-accent rounded-xl text-primary-foreground font-bold text-sm">
          Fazer Pedido
        </button>
      </div>
    </div>
  );
};

export default PaymentSimulation;
