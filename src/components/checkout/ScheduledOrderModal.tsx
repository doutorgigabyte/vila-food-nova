import { useState, useMemo } from "react";
import { format, addDays, setHours, setMinutes, isBefore, isAfter, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, CalendarClock, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

interface OperatingHours {
  [key: string]: {
    open: boolean;
    start: string;
    end: string;
  };
}

interface ScheduledOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledFor: Date) => void;
  storeName: string;
  operatingHours: OperatingHours | null;
}

const dayMapping: { [key: number]: string } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

const dayNames: { [key: string]: string } = {
  sunday: 'Domingo',
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
};

export function ScheduledOrderModal({
  isOpen,
  onClose,
  onSchedule,
  storeName,
  operatingHours,
}: ScheduledOrderModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Get available times for selected date
  const availableTimes = useMemo(() => {
    if (!selectedDate || !operatingHours) return [];

    const dayKey = dayMapping[selectedDate.getDay()];
    const dayHours = operatingHours[dayKey];

    if (!dayHours?.open) return [];

    const times: string[] = [];
    const [startH, startM] = dayHours.start.split(':').map(Number);
    const [endH, endM] = dayHours.end.split(':').map(Number);

    // Handle overnight hours (e.g., 18:00 - 02:00)
    const isOvernight = endH < startH || (endH === startH && endM < startM);
    
    let currentH = startH;
    let currentM = startM;

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    while (true) {
      // Check if we've passed the end time
      if (!isOvernight) {
        if (currentH > endH || (currentH === endH && currentM > endM)) break;
      } else {
        // For overnight, break after going through both parts
        if (currentH >= 24) {
          currentH = 0;
        }
        if (currentH >= endH && currentH < startH) break;
      }

      const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
      
      // If today, only show future times (at least 30 min from now)
      if (isToday) {
        const slotTime = setMinutes(setHours(selectedDate, currentH), currentM);
        const minTime = new Date(now.getTime() + 30 * 60000);
        if (isAfter(slotTime, minTime)) {
          times.push(timeStr);
        }
      } else {
        times.push(timeStr);
      }

      // Increment by 30 minutes
      currentM += 30;
      if (currentM >= 60) {
        currentM = 0;
        currentH += 1;
      }

      // Prevent infinite loop
      if (times.length > 48) break;
    }

    return times;
  }, [selectedDate, operatingHours]);

  // Get next available date and time
  const getNextAvailableInfo = useMemo(() => {
    if (!operatingHours) return null;

    const now = new Date();
    
    for (let i = 0; i < 14; i++) {
      const checkDate = addDays(startOfToday(), i);
      const dayKey = dayMapping[checkDate.getDay()];
      const dayHours = operatingHours[dayKey];

      if (dayHours?.open) {
        const [startH, startM] = dayHours.start.split(':').map(Number);
        const openTime = setMinutes(setHours(checkDate, startH), startM);

        if (isAfter(openTime, now) || i > 0) {
          return {
            date: checkDate,
            dayName: dayNames[dayKey],
            time: dayHours.start,
          };
        }
      }
    }
    return null;
  }, [operatingHours]);

  // Disable dates where store is closed
  const isDateDisabled = (date: Date) => {
    if (!operatingHours) return true;
    if (isBefore(date, startOfToday())) return true;
    if (isAfter(date, addDays(startOfToday(), 30))) return true;

    const dayKey = dayMapping[date.getDay()];
    const dayHours = operatingHours[dayKey];
    return !dayHours?.open;
  };

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDate = setMinutes(setHours(selectedDate, hours), minutes);
    
    onSchedule(scheduledDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Agendar Pedido
          </DialogTitle>
          <DialogDescription>
            <strong>{storeName}</strong> está fechado agora. Mas você pode agendar seu pedido para quando a loja abrir!
          </DialogDescription>
        </DialogHeader>

        {getNextAvailableInfo && (
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-medium">Próximo horário disponível:</p>
              <p className="text-muted-foreground">
                {getNextAvailableInfo.dayName} às {getNextAvailableInfo.time}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Escolha a data
            </Label>
            <div className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime("");
                }}
                disabled={isDateDisabled}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Escolha o horário - {format(selectedDate, "dd/MM", { locale: ptBR })}
              </Label>
              
              {availableTimes.length > 0 ? (
                <RadioGroup
                  value={selectedTime}
                  onValueChange={setSelectedTime}
                  className="grid grid-cols-4 gap-2"
                >
                  {availableTimes.map((time) => (
                    <div key={time}>
                      <RadioGroupItem
                        value={time}
                        id={`time-${time}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`time-${time}`}
                        className="flex items-center justify-center px-2 py-2 text-sm border rounded-md cursor-pointer hover:bg-accent peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors"
                      >
                        {time}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span>Nenhum horário disponível para esta data</span>
                </div>
              )}
            </div>
          )}

          {/* Selected Summary */}
          {selectedDate && selectedTime && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Seu pedido será agendado para:</p>
              <p className="text-lg font-bold text-primary">
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime}
            className="flex-1"
          >
            <CalendarClock className="h-4 w-4 mr-2" />
            Agendar Pedido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
