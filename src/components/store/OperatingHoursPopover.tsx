import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface OperatingHoursDay {
  open?: boolean;
  enabled?: boolean;
  start?: string;
  end?: string;
  close?: string;
}

interface OperatingHours {
  [key: string]: OperatingHoursDay;
}

interface OperatingHoursPopoverProps {
  operatingHours: OperatingHours | null;
  isOpen: boolean;
}

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const dayNames: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

const dayMapping: { [key: number]: string } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

function normalizeHours(hours: OperatingHoursDay): { isOpen: boolean; start: string; end: string } {
  const isOpen = hours.enabled ?? hours.open ?? false;
  const start = hours.start ?? (typeof hours.open === 'string' ? hours.open : "08:00");
  const end = hours.end ?? hours.close ?? "22:00";
  return { isOpen, start, end };
}

export function OperatingHoursPopover({ operatingHours, isOpen }: OperatingHoursPopoverProps) {
  const today = dayMapping[new Date().getDay()];

  if (!operatingHours) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          title="Ver horários de funcionamento"
        >
          <Clock className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Horários de Funcionamento</h4>
            {isOpen ? (
              <Badge className="bg-green-500 hover:bg-green-500 text-xs">Aberto</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Fechado</Badge>
            )}
          </div>
        </div>
        <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
          {dayOrder.map((day) => {
            const dayData = operatingHours[day];
            const isToday = day === today;
            
            if (!dayData) {
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    isToday ? "bg-primary/10 font-medium" : ""
                  }`}
                >
                  <span className={isToday ? "text-primary" : "text-muted-foreground"}>
                    {dayNames[day]}
                    {isToday && " (Hoje)"}
                  </span>
                  <span className="text-muted-foreground">Fechado</span>
                </div>
              );
            }

            const { isOpen: dayOpen, start, end } = normalizeHours(dayData);

            return (
              <div
                key={day}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  isToday ? "bg-primary/10" : ""
                }`}
              >
                <span className={`${isToday ? "text-primary font-medium" : ""}`}>
                  {dayNames[day]}
                  {isToday && " (Hoje)"}
                </span>
                {dayOpen ? (
                  <span className={`${isToday ? "text-primary font-medium" : "text-foreground"}`}>
                    {start} - {end}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
