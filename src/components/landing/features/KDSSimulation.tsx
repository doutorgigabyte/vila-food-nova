import { useState, useEffect } from "react";
import { Clock, ChefHat, Check, Bell } from "lucide-react";

interface Order {
  id: string;
  number: number;
  items: string[];
  time: number;
  status: "new" | "preparing" | "ready";
  customer: string;
  type: "delivery" | "pickup" | "table";
}

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    number: 342,
    items: ["2x Hambúrguer", "1x Batata G"],
    time: 0,
    status: "new",
    customer: "João",
    type: "delivery",
  },
  {
    id: "2",
    number: 341,
    items: ["1x Pizza Margherita"],
    time: 180,
    status: "preparing",
    customer: "Maria",
    type: "pickup",
  },
  {
    id: "3",
    number: 340,
    items: ["3x Açaí 500ml"],
    time: 420,
    status: "ready",
    customer: "Pedro",
    type: "table",
  },
];

const KDSSimulation = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [showNotification, setShowNotification] = useState(false);
  const [newOrderAnimation, setNewOrderAnimation] = useState(false);

  // Update times
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          time: order.status !== "ready" ? order.time + 1 : order.time,
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new order notification
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      setShowNotification(true);
      setNewOrderAnimation(true);
      setTimeout(() => {
        setShowNotification(false);
        setNewOrderAnimation(false);
      }, 2000);
    }, 6000);

    return () => clearInterval(notificationInterval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "bg-yellow-500";
      case "preparing":
        return "bg-blue-500";
      case "ready":
        return "bg-emerald-500";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "Novo";
      case "preparing":
        return "Prep.";
      case "ready":
        return "Pronto";
    }
  };

  const getTypeIcon = (type: Order["type"]) => {
    switch (type) {
      case "delivery":
        return "🛵";
      case "pickup":
        return "🏪";
      case "table":
        return "🍽️";
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-1.5">
          <ChefHat className="w-4 h-4 text-orange-400" />
          <span className="text-white font-semibold text-xs">Cozinha</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Bell className={`w-4 h-4 ${showNotification ? "text-yellow-400 animate-bounce" : "text-white/60"}`} />
            {showNotification && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[10px] text-white/60">{orders.length}</span>
        </div>
      </div>

      {/* Notification banner */}
      {showNotification && (
        <div className="bg-yellow-500 px-2 py-1 flex items-center gap-1.5 animate-fade-up">
          <Bell className="w-3 h-3 text-black animate-bounce" />
          <span className="text-black text-[10px] font-bold">🔔 NOVO PEDIDO #343!</span>
        </div>
      )}

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
        {orders.map((order, index) => (
          <div
            key={order.id}
            className={`rounded-lg border overflow-hidden transition-all ${
              index === 0 && newOrderAnimation
                ? "ring-1 ring-yellow-400 animate-pulse"
                : ""
            } ${
              order.status === "new"
                ? "border-yellow-500/50 bg-yellow-500/10"
                : order.status === "preparing"
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-emerald-500/50 bg-emerald-500/10"
            }`}
          >
            {/* Order header */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{getTypeIcon(order.type)}</span>
                <span className="text-white font-bold text-xs">#{order.number}</span>
                <span className="text-white/60 text-[10px]">{order.customer}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-white/80">
                  <Clock className="w-3 h-3" />
                  <span className={`text-[10px] font-mono ${order.time > 300 ? "text-red-400" : ""}`}>
                    {formatTime(order.time)}
                  </span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="px-2 py-1">
              {order.items.map((item, i) => (
                <p key={i} className="text-white/90 text-[10px]">• {item}</p>
              ))}
            </div>

            {/* Actions */}
            <div className="px-2 py-1.5 bg-white/5">
              {order.status === "new" && (
                <button className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-blue-500 rounded text-white text-[10px] font-medium">
                  <ChefHat className="w-3 h-3" />
                  Iniciar
                </button>
              )}
              {order.status === "preparing" && (
                <button className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-emerald-500 rounded text-white text-[10px] font-medium">
                  <Check className="w-3 h-3" />
                  Pronto
                </button>
              )}
              {order.status === "ready" && (
                <div className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-emerald-500/20 rounded text-emerald-400 text-[10px] font-medium">
                  <Check className="w-3 h-3" />
                  Aguardando
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-0.5 p-1.5 bg-zinc-800 border-t border-zinc-700">
        <div className="text-center py-1">
          <p className="text-yellow-400 font-bold text-xs">1</p>
          <p className="text-white/40 text-[9px]">Novos</p>
        </div>
        <div className="text-center py-1">
          <p className="text-blue-400 font-bold text-xs">1</p>
          <p className="text-white/40 text-[9px]">Prep.</p>
        </div>
        <div className="text-center py-1">
          <p className="text-emerald-400 font-bold text-xs">1</p>
          <p className="text-white/40 text-[9px]">Prontos</p>
        </div>
      </div>
    </div>
  );
};

export default KDSSimulation;
