import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock } from "lucide-react";

interface Metric {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

const ReportsSimulation = () => {
  const [salesValue, setSalesValue] = useState(0);
  const [ordersValue, setOrdersValue] = useState(0);
  const [ticketValue, setTicketValue] = useState(0);
  const [chartBars, setChartBars] = useState([40, 65, 45, 80, 55, 90, 70]);

  // Animate counting numbers
  useEffect(() => {
    const targetSales = 2450;
    const targetOrders = 54;
    const targetTicket = 45;

    const interval = setInterval(() => {
      setSalesValue((prev) => Math.min(prev + 50, targetSales));
      setOrdersValue((prev) => Math.min(prev + 1, targetOrders));
      setTicketValue((prev) => Math.min(prev + 1, targetTicket));
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Animate chart bars
  useEffect(() => {
    const interval = setInterval(() => {
      setChartBars((prev) =>
        prev.map((bar) => {
          const change = (Math.random() - 0.5) * 20;
          return Math.max(20, Math.min(100, bar + change));
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const metrics: Metric[] = [
    {
      label: "Vendas",
      value: `R$ ${salesValue.toLocaleString("pt-BR")}`,
      change: 12.5,
      icon: DollarSign,
      color: "from-emerald-400 to-emerald-600",
    },
    {
      label: "Pedidos",
      value: ordersValue.toString(),
      change: 8.2,
      icon: ShoppingBag,
      color: "from-blue-400 to-blue-600",
    },
    {
      label: "Ticket",
      value: `R$ ${ticketValue}`,
      change: -2.1,
      icon: TrendingUp,
      color: "from-purple-400 to-purple-600",
    },
  ];

  const topProducts = [
    { name: "Pizza Margherita", quantity: 23, revenue: "R$ 1.035" },
    { name: "Hambúrguer", quantity: 18, revenue: "R$ 684" },
    { name: "Açaí 500ml", quantity: 15, revenue: "R$ 420" },
  ];

  const peakHours = [
    { hour: "12h", orders: 12 },
    { hour: "13h", orders: 8 },
    { hour: "18h", orders: 6 },
    { hour: "19h", orders: 15 },
    { hour: "20h", orders: 18 },
    { hour: "21h", orders: 10 },
    { hour: "22h", orders: 5 },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-y-auto">
      {/* Header */}
      <div className="px-2 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-xs">Dashboard</h3>
            <p className="text-white/50 text-[9px]">Hoje, 11 Dez</p>
          </div>
          <div className="px-1.5 py-0.5 bg-emerald-500/20 rounded-full">
            <span className="text-emerald-400 text-[8px] font-medium">● Ao vivo</span>
          </div>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="p-2 grid grid-cols-3 gap-1.5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-2 bg-zinc-900 rounded-lg border border-zinc-800"
          >
            <div className={`w-5 h-5 rounded bg-gradient-to-br ${metric.color} flex items-center justify-center mb-1`}>
              <metric.icon className="w-3 h-3 text-white" />
            </div>
            <p className="text-white font-bold text-[10px]">{metric.value}</p>
            <p className="text-white/40 text-[8px]">{metric.label}</p>
            <div className={`flex items-center gap-0.5 ${metric.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {metric.change >= 0 ? (
                <TrendingUp className="w-2 h-2" />
              ) : (
                <TrendingDown className="w-2 h-2" />
              )}
              <span className="text-[8px] font-medium">{Math.abs(metric.change)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-2 pb-2">
        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
          <p className="text-white/60 text-[9px] mb-2">Vendas/hora</p>
          <div className="flex items-end justify-between h-14 gap-0.5">
            {chartBars.map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full bg-gradient-to-t from-primary/80 to-primary rounded-t transition-all duration-500"
                  style={{ height: `${height}%` }}
                />
                <span className="text-white/30 text-[7px]">{peakHours[i]?.hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="px-2 pb-2">
        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-[9px]">Mais vendidos</p>
            <span className="text-primary text-[8px]">Ver todos</span>
          </div>
          <div className="space-y-1.5">
            {topProducts.map((product, i) => (
              <div key={product.name} className="flex items-center gap-1.5">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-zinc-400 text-black" : "bg-amber-700 text-white"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[9px] truncate">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-[8px]">{product.quantity}x</p>
                  <p className="text-emerald-400 text-[8px] font-medium">{product.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak hours */}
      <div className="px-2 pb-2">
        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-primary" />
            <p className="text-white/60 text-[9px]">Horário de pico</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-white font-bold text-sm">20h - 21h</p>
              <p className="text-white/40 text-[8px]">18 pedidos em média</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-2 pb-2">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Users className="w-3 h-3 text-emerald-400 mb-0.5" />
            <p className="text-emerald-400 font-bold text-xs">32</p>
            <p className="text-emerald-400/60 text-[8px]">Novos clientes</p>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <TrendingUp className="w-3 h-3 text-blue-400 mb-0.5" />
            <p className="text-blue-400 font-bold text-xs">89%</p>
            <p className="text-blue-400/60 text-[8px]">Conversão</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsSimulation;
