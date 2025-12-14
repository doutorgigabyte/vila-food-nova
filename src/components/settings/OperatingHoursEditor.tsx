import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Plus, 
  Trash2, 
  Copy,
  CheckCircle2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface OperatingHoursDay {
  open: boolean;
  start: string;
  end: string;
}

interface OperatingHours {
  [key: string]: OperatingHoursDay;
}

interface TimeBlock {
  id: string;
  start: string;
  end: string;
  days: string[];
}

interface OperatingHoursEditorProps {
  value: OperatingHours;
  onChange: (hours: OperatingHours) => void;
}

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const dayNames: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const dayAbbrev: Record<string, string> = {
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
  sunday: "Dom",
};

export function OperatingHoursEditor({ value, onChange }: OperatingHoursEditorProps) {
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newBlock, setNewBlock] = useState<{ start: string; end: string; days: string[] }>({
    start: "08:00",
    end: "22:00",
    days: [],
  });

  // Convert current hours to time blocks for display
  const getTimeBlocks = (): TimeBlock[] => {
    const blocks: TimeBlock[] = [];
    const processedDays = new Set<string>();

    dayOrder.forEach((day) => {
      if (processedDays.has(day)) return;
      
      const dayHours = value[day];
      if (!dayHours?.open) return;

      // Find other days with same hours
      const sameDays = dayOrder.filter((d) => {
        const h = value[d];
        return h?.open && h.start === dayHours.start && h.end === dayHours.end;
      });

      sameDays.forEach((d) => processedDays.add(d));

      blocks.push({
        id: `${dayHours.start}-${dayHours.end}-${sameDays.join(",")}`,
        start: dayHours.start,
        end: dayHours.end,
        days: sameDays,
      });
    });

    return blocks;
  };

  const timeBlocks = getTimeBlocks();

  // Get closed days
  const closedDays = dayOrder.filter((day) => !value[day]?.open);

  // Apply time block to selected days
  const applyTimeBlock = () => {
    if (newBlock.days.length === 0) {
      toast.error("Selecione pelo menos um dia");
      return;
    }

    const updated = { ...value };
    newBlock.days.forEach((day) => {
      updated[day] = {
        open: true,
        start: newBlock.start,
        end: newBlock.end,
      };
    });

    onChange(updated);
    setShowBlockModal(false);
    setNewBlock({ start: "08:00", end: "22:00", days: [] });
    toast.success("Horário aplicado com sucesso!");
  };

  // Quick actions
  const applyToAllDays = (start: string, end: string) => {
    const updated: OperatingHours = {};
    dayOrder.forEach((day) => {
      updated[day] = { open: true, start, end };
    });
    onChange(updated);
    toast.success("Horário aplicado a todos os dias!");
  };

  const applyToWeekdays = (start: string, end: string) => {
    const updated = { ...value };
    ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((day) => {
      updated[day] = { open: true, start, end };
    });
    onChange(updated);
    toast.success("Horário aplicado aos dias úteis!");
  };

  const toggleDay = (day: string) => {
    const current = value[day];
    onChange({
      ...value,
      [day]: { 
        ...current, 
        open: !current?.open,
        start: current?.start || "08:00",
        end: current?.end || "22:00"
      }
    });
  };

  const updateDayHours = (day: string, field: "start" | "end", newValue: string) => {
    const current = value[day];
    onChange({
      ...value,
      [day]: { ...current, [field]: newValue }
    });
  };

  const removeBlock = (block: TimeBlock) => {
    const updated = { ...value };
    block.days.forEach((day) => {
      updated[day] = { ...updated[day], open: false };
    });
    onChange(updated);
    toast.success("Bloco de horário removido!");
  };

  const toggleDayInNewBlock = (day: string) => {
    setNewBlock((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const selectAllWeekdays = () => {
    setNewBlock((prev) => ({
      ...prev,
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    }));
  };

  const selectWeekend = () => {
    setNewBlock((prev) => ({
      ...prev,
      days: ["saturday", "sunday"],
    }));
  };

  const selectAllDays = () => {
    setNewBlock((prev) => ({
      ...prev,
      days: [...dayOrder],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Current Time Blocks */}
      {timeBlocks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Horários Configurados</h4>
          {timeBlocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {block.start} às {block.end}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {block.days.map((day) => (
                      <Badge key={day} variant="secondary" className="text-xs">
                        {dayAbbrev[day]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeBlock(block)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Closed Days */}
      {closedDays.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Dias Fechados</h4>
          <div className="flex flex-wrap gap-2">
            {closedDays.map((day) => (
              <Badge
                key={day}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => toggleDay(day)}
              >
                {dayNames[day]} (clique para abrir)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add Block Button */}
      <Button
        variant="outline"
        onClick={() => setShowBlockModal(true)}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Bloco de Horário
      </Button>

      {/* Quick Actions */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => applyToAllDays("08:00", "22:00")}
          >
            <Copy className="w-3 h-3 mr-1" />
            08h-22h todos os dias
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => applyToWeekdays("08:00", "18:00")}
          >
            <Copy className="w-3 h-3 mr-1" />
            08h-18h dias úteis
          </Button>
        </CardContent>
      </Card>

      {/* Detailed View (Collapsible) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Ver todos os dias detalhados
        </summary>
        <div className="mt-4 space-y-2">
          {dayOrder.map((day) => {
            const hours = value[day] || { open: false, start: "08:00", end: "22:00" };
            return (
              <div
                key={day}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  hours.open ? "bg-muted/30" : "bg-muted/10 opacity-60"
                }`}
              >
                <Switch
                  checked={hours.open}
                  onCheckedChange={() => toggleDay(day)}
                />
                <span className="w-24 font-medium">{dayNames[day]}</span>
                {hours.open ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={hours.start}
                      onChange={(e) => updateDayHours(day, "start", e.target.value)}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={hours.end}
                      onChange={(e) => updateDayHours(day, "end", e.target.value)}
                      className="w-28"
                    />
                  </div>
                ) : (
                  <Badge variant="secondary">Fechado</Badge>
                )}
              </div>
            );
          })}
        </div>
      </details>

      {/* Add Block Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Bloco de Horário</DialogTitle>
            <DialogDescription>
              Defina um horário e selecione os dias que ele se aplica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Time Selection */}
            <div className="space-y-3">
              <h4 className="font-medium">Horário de Funcionamento</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Abre às</label>
                  <Input
                    type="time"
                    value={newBlock.start}
                    onChange={(e) => setNewBlock({ ...newBlock, start: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Fecha às</label>
                  <Input
                    type="time"
                    value={newBlock.end}
                    onChange={(e) => setNewBlock({ ...newBlock, end: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Day Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Dias</h4>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={selectAllWeekdays}>
                    Seg-Sex
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectWeekend}>
                    Fim de semana
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectAllDays}>
                    Todos
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {dayOrder.map((day) => {
                  const isSelected = newBlock.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayInNewBlock(day)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/30 hover:bg-muted"
                      }`}
                    >
                      <span className="text-xs font-medium">{dayAbbrev[day]}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-3 h-3 mx-auto mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockModal(false)}>
              Cancelar
            </Button>
            <Button onClick={applyTimeBlock}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Aplicar Horário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
