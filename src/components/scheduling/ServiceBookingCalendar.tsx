import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addMinutes, parse, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, Loader2 } from 'lucide-react';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface ServiceBookingCalendarProps {
  establishmentId: string;
  productId?: string;
  slotDuration?: number;
  onSelectSlot: (date: Date, time: string) => void;
}

export function ServiceBookingCalendar({
  establishmentId,
  productId,
  slotDuration = 60,
  onSelectSlot,
}: ServiceBookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<number, any>>({});
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    loadAvailability();
  }, [establishmentId]);

  useEffect(() => {
    if (selectedDate) {
      loadBookingsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_availability')
        .select('*')
        .eq('establishment_id', establishmentId)
        .eq('is_active', true);

      if (error) throw error;

      const availabilityMap: Record<number, any> = {};
      data?.forEach(a => {
        availabilityMap[a.day_of_week] = a;
      });
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingsForDate = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    try {
      const [bookingsRes, blockedRes] = await Promise.all([
        supabase
          .from('service_bookings')
          .select('booking_time, end_time')
          .eq('establishment_id', establishmentId)
          .eq('booking_date', dateStr)
          .in('status', ['pending', 'confirmed']),
        supabase
          .from('service_blocked_slots')
          .select('*')
          .eq('establishment_id', establishmentId)
          .eq('blocked_date', dateStr),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (blockedRes.error) throw blockedRes.error;

      setExistingBookings(bookingsRes.data || []);
      setBlockedSlots(blockedRes.data || []);

      // Generate time slots for selected date
      generateTimeSlots(date, bookingsRes.data || [], blockedRes.data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Erro ao carregar horários');
    }
  };

  const generateTimeSlots = (date: Date, bookings: any[], blocked: any[]) => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability[dayOfWeek];

    if (!dayAvailability) {
      setTimeSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];
    const duration = dayAvailability.slot_duration || slotDuration;
    
    let currentTime = parse(dayAvailability.start_time, 'HH:mm:ss', date);
    const endTime = parse(dayAvailability.end_time, 'HH:mm:ss', date);

    while (isBefore(currentTime, endTime)) {
      const timeStr = format(currentTime, 'HH:mm');
      const slotEnd = addMinutes(currentTime, duration);

      // Check if slot is available
      const isBooked = bookings.some(b => {
        const bookingStart = b.booking_time.substring(0, 5);
        const bookingEnd = b.end_time.substring(0, 5);
        return timeStr >= bookingStart && timeStr < bookingEnd;
      });

      const isBlocked = blocked.some(b => {
        if (!b.start_time) return true; // Full day blocked
        const blockStart = b.start_time.substring(0, 5);
        const blockEnd = b.end_time.substring(0, 5);
        return timeStr >= blockStart && timeStr < blockEnd;
      });

      // Check if slot is in the past
      const now = new Date();
      const slotDateTime = new Date(date);
      const [hours, minutes] = timeStr.split(':').map(Number);
      slotDateTime.setHours(hours, minutes, 0, 0);
      const isPast = isBefore(slotDateTime, now);

      slots.push({
        time: timeStr,
        available: !isBooked && !isBlocked && !isPast,
      });

      currentTime = slotEnd;
    }

    setTimeSlots(slots);
  };

  const isDateDisabled = (date: Date) => {
    const dayOfWeek = date.getDay();
    const today = startOfDay(new Date());
    
    // Disable past dates
    if (isBefore(date, today)) return true;
    
    // Disable days without availability
    return !availability[dayOfWeek];
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      onSelectSlot(selectedDate, time);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Escolha data e horário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendar */}
          <div className="flex-shrink-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              locale={ptBR}
              className="rounded-md border pointer-events-auto"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="flex-1">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horários disponíveis em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h4>
              
              {timeSlots.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum horário disponível neste dia.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map(slot => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? 'default' : 'outline'}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => handleSelectTime(slot.time)}
                      className="relative"
                    >
                      {slot.time}
                      {!slot.available && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 text-[10px] px-1"
                        >
                          Ocupado
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedDate && selectedTime && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">
              Agendamento selecionado:
            </p>
            <p className="text-muted-foreground">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
