import { Clock } from "lucide-react";

interface OperatingHoursProps {
  operatingHours: Record<string, { open: boolean; start: string; end: string }> | null;
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

export const OperatingHoursDisplay = ({ operatingHours, compact = false }: OperatingHoursProps) => {
  if (!operatingHours) {
    return (
      <div className="text-sm text-muted-foreground">
        <p>Horários não informados</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = operatingHours[today];

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
          const hours = operatingHours[day];
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
              {hours?.open ? (
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
