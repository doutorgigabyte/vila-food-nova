import { useState, useMemo } from "react";
import { format, addDays, setHours, setMinutes, isBefore, isAfter, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, CalendarClock, AlertCircle, Repeat, CalendarDays } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface OperatingHours {
  [key: string]: {
    open: boolean;
    start: string;
    end: string;
  };
}

interface RecurrenceConfig {
  enabled: boolean;
  type: 'daily' | 'weekly' | 'custom';
  days: number[]; // 0-6 (domingo-sábado)
  endDate?: Date;
}

interface ScheduledOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledFor: Date, recurrence?: RecurrenceConfig) => void;
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

const weekDays = [
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
];

export function ScheduledOrderModal({
  isOpen,
  onClose,
  onSchedule,
  storeName,
  operatingHours,
}: ScheduledOrderModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    enabled: false,
    type: 'weekly',
    days: [],
    endDate: undefined,
  });

  // Get available times for selected date
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];

    // If no operating hours configured, provide default times (8:00 - 22:00)
    if (!operatingHours) {
      const times: string[] = [];
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      
      for (let h = 8; h <= 22; h++) {
        for (let m = 0; m < 60; m += 30) {
          const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          
          if (isToday) {
            const slotTime = setMinutes(setHours(selectedDate, h), m);
            const minTime = new Date(now.getTime() + 30 * 60000);
            if (isAfter(slotTime, minTime)) {
              times.push(timeStr);
            }
          } else {
            times.push(timeStr);
          }
        }
      }
      return times;
    }

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
    // Past dates are always disabled
    if (isBefore(date, startOfToday())) return true;
    // Dates more than 30 days in the future are disabled
    if (isAfter(date, addDays(startOfToday(), 30))) return true;
    
    // If no operating hours configured, allow all future dates
    if (!operatingHours) return false;

    const dayKey = dayMapping[date.getDay()];
    const dayHours = operatingHours[dayKey];
    return !dayHours?.open;
  };

  const toggleRecurrenceDay = (day: number) => {
    setRecurrence(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort((a, b) => a - b),
    }));
  };

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDate = setMinutes(setHours(selectedDate, hours), minutes);
    
    onSchedule(scheduledDate, recurrence.enabled ? recurrence : undefined);
  };

  const getRecurrenceSummary = () => {
    if (!recurrence.enabled) return null;
    
    if (recurrence.type === 'daily') {
      return 'Todos os dias';
    }
    
    if (recurrence.days.length === 0) return 'Selecione os dias';
    
    if (recurrence.days.length === 5 && 
        recurrence.days.every(d => d >= 1 && d <= 5)) {
      return 'Segunda a Sexta';
    }
    
    const dayLabels = recurrence.days.map(d => 
      weekDays.find(wd => wd.value === d)?.label
    ).join(', ');
    
    return dayLabels;
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

          {/* Recurrence Section */}
          {selectedDate && selectedTime && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Repeat className="h-4 w-4" />
                  Repetir pedido
                </Label>
                <Switch
                  checked={recurrence.enabled}
                  onCheckedChange={(checked) => 
                    setRecurrence(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              {recurrence.enabled && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Recurrence Type */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Frequência</Label>
                    <RadioGroup
                      value={recurrence.type}
                      onValueChange={(v) => setRecurrence(prev => ({ 
                        ...prev, 
                        type: v as 'daily' | 'weekly' | 'custom',
                        days: v === 'daily' ? [0,1,2,3,4,5,6] : v === 'weekly' ? [1,2,3,4,5] : prev.days
                      }))}
                      className="flex gap-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="daily" id="rec-daily" className="peer sr-only" />
                        <Label
                          htmlFor="rec-daily"
                          className="px-3 py-1.5 text-xs border rounded-full cursor-pointer hover:bg-accent peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors"
                        >
                          Diário
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="weekly" id="rec-weekly" className="peer sr-only" />
                        <Label
                          htmlFor="rec-weekly"
                          className="px-3 py-1.5 text-xs border rounded-full cursor-pointer hover:bg-accent peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors"
                        >
                          Seg-Sex
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="custom" id="rec-custom" className="peer sr-only" />
                        <Label
                          htmlFor="rec-custom"
                          className="px-3 py-1.5 text-xs border rounded-full cursor-pointer hover:bg-accent peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-colors"
                        >
                          Personalizado
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Custom Days Selection */}
                  {recurrence.type === 'custom' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Dias da semana</Label>
                      <div className="flex gap-1 flex-wrap">
                        {weekDays.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleRecurrenceDay(day.value)}
                            className={`w-10 h-10 rounded-full text-xs font-medium transition-colors ${
                              recurrence.days.includes(day.value)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border hover:bg-accent'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Até quando? (opcional)
                    </Label>
                    <Input
                      type="date"
                      min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
                      value={recurrence.endDate ? format(recurrence.endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setRecurrence(prev => ({
                        ...prev,
                        endDate: e.target.value ? new Date(e.target.value) : undefined
                      }))}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Summary */}
                  <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
                    📅 {getRecurrenceSummary()} às {selectedTime}
                    {recurrence.endDate && ` até ${format(recurrence.endDate, "dd/MM/yyyy")}`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Summary */}
          {selectedDate && selectedTime && !recurrence.enabled && (
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
            disabled={!selectedDate || !selectedTime || (recurrence.enabled && recurrence.type === 'custom' && recurrence.days.length === 0)}
            className="flex-1"
          >
            <CalendarClock className="h-4 w-4 mr-2" />
            {recurrence.enabled ? 'Agendar Recorrente' : 'Agendar Pedido'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}