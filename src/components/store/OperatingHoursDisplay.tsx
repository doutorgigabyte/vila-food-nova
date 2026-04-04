import { Clock } from "lucide-react";

interface OperatingHoursInput {
  // New format
  open?: boolean;
  start?: string;
  end?: string;
  // Old format (for backwards compatibility)
  enabled?: boolean;
  close?: string;
  isOpen?: boolean;
}

interface OperatingHoursProps {
  operatingHours: Record<string, OperatingHoursInput> | null;
  compact?: boolean;
}

const dayNames: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Normalize hours to handle old formats
function normalizeHours(hours: OperatingHoursInput): { open: boolean; start: string; end: string } {
  const isOpen = hours.enabled ?? hours.isOpen ?? hours.open ?? false;
  const start = hours.start ?? (typeof hours.open === 'string' ? hours.open : "08:00");
  const end = hours.end ?? hours.close ?? "22:00";
  
  return { open: isOpen, start, end };
}

export const OperatingHoursDisplay = ({ operatingHours, compact = false }: OperatingHoursProps) => {
  if (!operatingHours) {
    return (
      <div className="text-sm text-muted-foreground">
        <p>Horários não informados</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const rawTodayHours = operatingHours[today];
  const todayHours = rawTodayHours ? normalizeHours(rawTodayHours) : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-primary" />
        {todayHours?.open ? (
          <span>
            Hoje: <span className="font-medium">{todayHours.start} - {todayHours.end}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Fechado hoje</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-primary" />
        <h4 className="font-semibold">Horário de Funcionamento</h4>
      </div>
      <div className="space-y-1.5">
        {dayOrder.map((day) => {
          const rawHours = operatingHours[day];
          const hours = rawHours ? normalizeHours(rawHours) : { open: false, start: "08:00", end: "22:00" };
          const isToday = day === today;
          
          return (
            <div
              key={day}
              className={`flex justify-between text-sm py-1 px-2 rounded ${
                isToday ? "bg-primary/10 font-medium" : ""
              }`}
            >
              <span className={isToday ? "text-primary" : "text-muted-foreground"}>
                {dayNames[day]}
                {isToday && " (hoje)"}
              </span>
              {hours.open ? (
                <span>{hours.start} - {hours.end}</span>
              ) : (
                <span className="text-muted-foreground">Fechado</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
