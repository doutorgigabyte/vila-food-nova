import { useState, useEffect } from "react";
import { MapPin, Phone, MessageCircle, Navigation, Clock, Check, Package } from "lucide-react";

interface DeliveryStatus {
  id: string;
  label: string;
  icon: React.ElementType;
  time?: string;
  completed: boolean;
  active: boolean;
}

const DeliverySimulation = () => {
  const [progress, setProgress] = useState(0);
  const [driverPosition, setDriverPosition] = useState({ x: 20, y: 60 });
  const [currentStep, setCurrentStep] = useState(1);

  const statuses: DeliveryStatus[] = [
    { id: "confirmed", label: "Pedido confirmado", icon: Check, time: "14:32", completed: currentStep > 0, active: currentStep === 0 },
    { id: "preparing", label: "Preparando", icon: Package, time: "14:35", completed: currentStep > 1, active: currentStep === 1 },
    { id: "pickup", label: "Saiu para entrega", icon: Navigation, time: "14:48", completed: currentStep > 2, active: currentStep === 2 },
    { id: "arriving", label: "Chegando", icon: MapPin, completed: currentStep > 3, active: currentStep === 3 },
  ];

  // Animate driver position
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverPosition((prev) => {
        const newX = prev.x + (Math.random() - 0.3) * 5;
        const newY = prev.y + (Math.random() - 0.7) * 3;
        return {
          x: Math.max(10, Math.min(90, newX)),
          y: Math.max(30, Math.min(80, newY)),
        };
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Progress through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 5);
      setProgress((prev) => (prev + 25) % 125);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Map area */}
      <div className="relative h-48 bg-zinc-900 overflow-hidden">
        {/* Simplified map background */}
        <div className="absolute inset-0">
          {/* Grid lines for "streets" */}
          <svg className="w-full h-full opacity-30">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-zinc-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* "Roads" */}
          <div className="absolute top-1/2 left-0 right-0 h-3 bg-zinc-700/50 transform -translate-y-1/2" />
          <div className="absolute top-0 bottom-0 left-1/3 w-3 bg-zinc-700/50" />
          <div className="absolute top-0 bottom-0 right-1/4 w-3 bg-zinc-700/50" />
        </div>

        {/* Destination marker */}
        <div className="absolute right-6 top-8">
          <div className="relative">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
          </div>
          <p className="text-white text-[10px] text-center mt-2 whitespace-nowrap">Sua casa</p>
        </div>

        {/* Driver marker */}
        <div
          className="absolute transition-all duration-500 ease-out"
          style={{ left: `${driverPosition.x}%`, top: `${driverPosition.y}%` }}
        >
          <div className="relative">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse">
              <span className="text-lg">🛵</span>
            </div>
            {/* Ripple effect */}
            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
          </div>
        </div>

        {/* Route line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path
            d={`M ${driverPosition.x}% ${driverPosition.y}% Q 70% 50% 85% 20%`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray="8 4"
            className="animate-pulse"
          />
        </svg>

        {/* ETA badge */}
        <div className="absolute bottom-3 left-3 px-3 py-2 bg-black/80 backdrop-blur rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-white font-bold text-sm">
              {currentStep < 3 ? "12 min" : "3 min"}
            </span>
          </div>
        </div>
      </div>

      {/* Driver info */}
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-xl">👨</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Carlos está a caminho</p>
            <p className="text-white/50 text-xs">Honda CG • ABC-1234</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-emerald-500/20 rounded-full">
              <Phone className="w-4 h-4 text-emerald-400" />
            </button>
            <button className="p-2 bg-blue-500/20 rounded-full">
              <MessageCircle className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Status timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-0">
          {statuses.map((status, index) => (
            <div key={status.id} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    status.completed
                      ? "bg-emerald-500"
                      : status.active
                      ? "bg-primary animate-pulse"
                      : "bg-zinc-700"
                  }`}
                >
                  <status.icon className={`w-4 h-4 ${status.completed || status.active ? "text-white" : "text-white/40"}`} />
                </div>
                {index < statuses.length - 1 && (
                  <div className={`w-0.5 h-12 ${status.completed ? "bg-emerald-500" : "bg-zinc-700"}`} />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-6">
                <p className={`font-medium text-sm ${status.completed || status.active ? "text-white" : "text-white/40"}`}>
                  {status.label}
                </p>
                {status.time && (
                  <p className="text-white/40 text-xs">{status.time}</p>
                )}
                {status.active && (
                  <div className="mt-2 px-3 py-2 bg-primary/20 rounded-lg border border-primary/30">
                    <p className="text-primary text-xs font-medium">Em andamento...</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order info */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs">Pedido #342</p>
            <p className="text-white font-medium text-sm">3 itens • R$ 89,00</p>
          </div>
          <button className="px-4 py-2 bg-zinc-800 rounded-lg text-white text-xs">
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliverySimulation;
