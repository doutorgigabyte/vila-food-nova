import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Save, Loader2 } from 'lucide-react';

interface Availability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

interface ServiceAvailabilityConfigProps {
  establishmentId: string;
}

export function ServiceAvailabilityConfig({ establishmentId }: ServiceAvailabilityConfigProps) {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [establishmentId]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_availability')
        .select('*')
        .eq('establishment_id', establishmentId);

      if (error) throw error;

      // Initialize all days with defaults if not exists
      const availabilityMap = new Map(
        data?.map(a => [a.day_of_week, a]) || []
      );

      const fullAvailability = DAYS_OF_WEEK.map(day => {
        const existing = availabilityMap.get(day.value);
        return existing || {
          day_of_week: day.value,
          start_time: '08:00',
          end_time: '18:00',
          slot_duration: 60,
          is_active: false,
        };
      });

      setAvailability(fullAvailability);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('Erro ao carregar disponibilidade');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (dayIndex: number, field: keyof Availability, value: any) => {
    setAvailability(prev => 
      prev.map((a, i) => 
        i === dayIndex ? { ...a, [field]: value } : a
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert all availability records
      for (const a of availability) {
        const { error } = await supabase
          .from('service_availability')
          .upsert({
            establishment_id: establishmentId,
            day_of_week: a.day_of_week,
            start_time: a.start_time,
            end_time: a.end_time,
            slot_duration: a.slot_duration,
            is_active: a.is_active,
          }, {
            onConflict: 'establishment_id,day_of_week',
          });

        if (error) throw error;
      }

      toast.success('Disponibilidade salva com sucesso!');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Erro ao salvar disponibilidade');
    } finally {
      setSaving(false);
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
          <Clock className="h-5 w-5" />
          Horários de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS_OF_WEEK.map((day, index) => {
          const dayAvailability = availability[index];
          return (
            <div
              key={day.value}
              className="flex flex-wrap items-center gap-4 p-4 border rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-[120px]">
                <Switch
                  id={`day-${day.value}`}
                  checked={dayAvailability?.is_active}
                  onCheckedChange={(checked) => handleChange(index, 'is_active', checked)}
                />
                <Label htmlFor={`day-${day.value}`} className="font-medium">
                  {day.label}
                </Label>
              </div>

              {dayAvailability?.is_active && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">De:</Label>
                    <Input
                      type="time"
                      value={dayAvailability.start_time}
                      onChange={(e) => handleChange(index, 'start_time', e.target.value)}
                      className="w-28"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Até:</Label>
                    <Input
                      type="time"
                      value={dayAvailability.end_time}
                      onChange={(e) => handleChange(index, 'end_time', e.target.value)}
                      className="w-28"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Duração:</Label>
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      value={dayAvailability.slot_duration}
                      onChange={(e) => handleChange(index, 'slot_duration', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Horários
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
