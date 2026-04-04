import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorySchedulerProps {
  onSchedule: (schedule: ScheduleData) => void;
  onBack: () => void;
  onSkip: () => void;
}

export interface ScheduleData {
  publishNow: boolean;
  scheduledFor?: Date;
  repostDays: number[];
  repostTimes: string[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

const PRESET_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

export default function StoryScheduler({ onSchedule, onBack, onSkip }: StorySchedulerProps) {
  const [publishNow, setPublishNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [enableRepost, setEnableRepost] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['09:00', '15:00', '20:00']);

  const toggleDay = useCallback((day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  }, []);

  const MAX_REPOSTS_PER_DAY = 3;

  const toggleTime = useCallback((time: string) => {
    setSelectedTimes(prev => {
      if (prev.includes(time)) {
        return prev.filter(t => t !== time);
      }
      if (prev.length >= MAX_REPOSTS_PER_DAY) {
        return prev; // Limit reached
      }
      return [...prev, time].sort();
    });
  }, []);

  const handleConfirm = () => {
    const schedule: ScheduleData = {
      publishNow,
      scheduledFor: !publishNow ? new Date(`${scheduledDate}T${scheduledTime}:00`) : undefined,
      repostDays: enableRepost ? selectedDays : [],
      repostTimes: enableRepost ? selectedTimes : [],
    };
    onSchedule(schedule);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Agendar Publicação</h2>
        <p className="text-muted-foreground text-sm">
          Escolha quando publicar e configurar repostagem automática
        </p>
      </div>

      {/* Publish Now Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Label htmlFor="publish-now" className="font-medium text-base">Publicar Agora</Label>
            <p className="text-xs text-muted-foreground">Seu story será publicado imediatamente</p>
          </div>
        </div>
        <Switch
          id="publish-now"
          checked={publishNow}
          onCheckedChange={setPublishNow}
        />
      </div>

      {/* Scheduled Date/Time */}
      {!publishNow && (
        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Calendar className="w-4 h-4" />
            <span>Data e Hora de Publicação</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date" className="text-xs text-muted-foreground">Data</Label>
              <input
                type="date"
                id="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-xs text-muted-foreground">Hora</Label>
              <input
                type="time"
                id="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Repost Configuration */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <Label htmlFor="enable-repost" className="font-medium text-base">Repostagem Automática</Label>
              <p className="text-xs text-muted-foreground">Repostar automaticamente em dias/horários</p>
            </div>
          </div>
          <Switch
            id="enable-repost"
            checked={enableRepost}
            onCheckedChange={setEnableRepost}
          />
        </div>

        {enableRepost && (
          <div className="space-y-4 pt-2 animate-fade-in">
            {/* Days Selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Dias da Semana</Label>
              <div className="flex gap-1.5">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                      selectedDays.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Times Selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Horários de Repostagem (max {MAX_REPOSTS_PER_DAY}x/dia)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TIMES.map(time => (
                  <button
                    key={time}
                    onClick={() => toggleTime(time)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      selectedTimes.includes(time)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedDays.length > 0 && selectedTimes.length > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-primary">
                  Seu story será repostado {selectedTimes.length}x por dia, 
                  em {selectedDays.length} dias da semana
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <Button 
          onClick={handleConfirm}
          className="flex-1"
        >
          Continuar
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <button
        onClick={onSkip}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Pular e publicar agora
      </button>
    </div>
  );
}
