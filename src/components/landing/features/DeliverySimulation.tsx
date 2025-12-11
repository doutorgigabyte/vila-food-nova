import { useState, useEffect } from "react";
import { MapPin, Phone, MessageCircle, Clock, Check, Package, Navigation } from "lucide-react";

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
  const [currentStep, setCurrentStep] = useState(1);

  const statuses: DeliveryStatus[] = [
    { id: "confirmed", label: "Pedido confirmado", icon: Check, time: "14:32", completed: currentStep > 0, active: currentStep === 0 },
    { id: "preparing", label: "Preparando", icon: Package, time: "14:35", completed: currentStep > 1, active: currentStep === 1 },
    { id: "pickup", label: "Saiu para entrega", icon: Navigation, time: "14:48", completed: currentStep > 2, active: currentStep === 2 },
    { id: "arriving", label: "Chegando", icon: MapPin, completed: currentStep > 3, active: currentStep === 3 },
  ];

  // Progress through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 5);
      setProgress(0);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Animate progress within step
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 100));
    }, 80);

    return () => clearInterval(interval);
  }, [currentStep]);

  // Calculate driver position on L-shaped route
  // Route: starts bottom-left, goes right, then turns up to destination
  const getDriverPosition = () => {
    // Phase 1 (0-50%): horizontal movement from left to middle-right
    // Phase 2 (50-100%): vertical movement from bottom to top
    if (progress <= 50) {
      // Horizontal: x goes from 15% to 75%
      const x = 15 + (progress / 50) * 60;
      const y = 75; // stays at bottom
      return { x, y };
    } else {
      // Vertical: y goes from 75% to 25%
      const x = 75; // stays at right
      const y = 75 - ((progress - 50) / 50) * 50;
      return { x, y };
    }
  };

  const driverPos = getDriverPosition();

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Map area */}
      <div className="relative h-40 bg-zinc-900 overflow-hidden">
        {/* Simplified map background */}
        <div className="absolute inset-0">
          {/* Grid lines for "streets" */}
          <svg className="w-full h-full opacity-30">
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-zinc-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Main roads */}
          <div className="absolute top-[75%] left-[10%] right-[20%] h-2 bg-zinc-700/60 transform -translate-y-1/2" />
          <div className="absolute top-[20%] bottom-[25%] right-[25%] w-2 bg-zinc-700/60" />
        </div>

        {/* L-shaped route line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Horizontal part of L */}
          <line
            x1="15%"
            y1="75%"
            x2="75%"
            y2="75%"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray="6 3"
            className="opacity-60"
          />
          {/* Vertical part of L */}
          <line
            x1="75%"
            y1="75%"
            x2="75%"
            y2="25%"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray="6 3"
            className="opacity-60"
          />
        </svg>

        {/* Start point (restaurant) */}
        <div className="absolute left-[12%] top-[72%]">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xs">🏪</span>
          </div>
        </div>

        {/* Destination marker (house) */}
        <div className="absolute right-[20%] top-[20%]">
          <div className="relative">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary" />
          </div>
          <p className="text-white text-[9px] text-center mt-1 whitespace-nowrap">Sua casa</p>
        </div>

        {/* Driver marker - follows L-shaped path */}
        <div
          className="absolute transition-all duration-300 ease-linear"
          style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <span className="text-sm">🛵</span>
            </div>
            {/* Ripple effect */}
            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
          </div>
        </div>

        {/* ETA badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 backdrop-blur rounded-lg">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-white font-bold text-xs">
              {currentStep < 3 ? "12 min" : "3 min"}
            </span>
          </div>
        </div>
      </div>

      {/* Driver info */}
      <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-base">👨</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-xs">Carlos está a caminho</p>
            <p className="text-white/50 text-[10px]">Honda CG • ABC-1234</p>
          </div>
          <div className="flex gap-1.5">
            <button className="p-1.5 bg-emerald-500/20 rounded-full">
              <Phone className="w-3 h-3 text-emerald-400" />
            </button>
            <button className="p-1.5 bg-blue-500/20 rounded-full">
              <MessageCircle className="w-3 h-3 text-blue-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Status timeline */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0">
          {statuses.map((status, index) => (
            <div key={status.id} className="flex gap-2">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    status.completed
                      ? "bg-emerald-500"
                      : status.active
                      ? "bg-primary animate-pulse"
                      : "bg-zinc-700"
                  }`}
                >
                  <status.icon className={`w-3 h-3 ${status.completed || status.active ? "text-white" : "text-white/40"}`} />
                </div>
                {index < statuses.length - 1 && (
                  <div className={`w-0.5 h-8 ${status.completed ? "bg-emerald-500" : "bg-zinc-700"}`} />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-4">
                <p className={`font-medium text-xs ${status.completed || status.active ? "text-white" : "text-white/40"}`}>
                  {status.label}
                </p>
                {status.time && (
                  <p className="text-white/40 text-[10px]">{status.time}</p>
                )}
                {status.active && (
                  <div className="mt-1 px-2 py-1 bg-primary/20 rounded border border-primary/30 inline-block">
                    <p className="text-primary text-[10px] font-medium">Em andamento...</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order info */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-[10px]">Pedido #342</p>
            <p className="text-white font-medium text-xs">3 itens • R$ 89,00</p>
          </div>
          <button className="px-3 py-1.5 bg-zinc-800 rounded-lg text-white text-[10px]">
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliverySimulation;
