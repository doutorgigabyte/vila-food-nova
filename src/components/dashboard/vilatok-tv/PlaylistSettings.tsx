import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Play, Shuffle, Repeat, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlaylistSettingsProps {
  establishmentId: string;
}

interface PlaylistSettingsData {
  id?: string;
  playback_mode: 'sequential' | 'random' | 'loop';
  default_duration: number;
  transition_type: 'fade' | 'slide' | 'zoom';
}

const DURATION_OPTIONS = [
  { value: 5, label: '5 segundos' },
  { value: 8, label: '8 segundos' },
  { value: 10, label: '10 segundos' },
  { value: 15, label: '15 segundos' },
  { value: 20, label: '20 segundos' },
  { value: 30, label: '30 segundos' },
];

const TRANSITION_OPTIONS = [
  { value: 'fade', label: 'Fade suave', icon: Sparkles },
  { value: 'slide', label: 'Deslizar', icon: Play },
  { value: 'zoom', label: 'Zoom', icon: Sparkles },
];

export function PlaylistSettings({ establishmentId }: PlaylistSettingsProps) {
  const [settings, setSettings] = useState<PlaylistSettingsData>({
    playback_mode: 'sequential',
    default_duration: 10,
    transition_type: 'fade'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, [establishmentId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await (supabase
        .from("tv_playlist_settings" as any)
        .select("*")
        .eq("establishment_id", establishmentId)
        .single() as any);
      
      if (data) {
        setSettings({
          id: data.id,
          playback_mode: data.playback_mode,
          default_duration: data.default_duration,
          transition_type: data.transition_type
        });
      }
    } catch (error) {
      // No settings yet, use defaults
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<PlaylistSettingsData>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      const payload = {
        establishment_id: establishmentId,
        playback_mode: updated.playback_mode,
        default_duration: updated.default_duration,
        transition_type: updated.transition_type,
        is_active: true
      };

      if (settings.id) {
        await (supabase
          .from("tv_playlist_settings" as any)
          .update(payload)
          .eq("id", settings.id) as any);
      } else {
        const { data } = await (supabase
          .from("tv_playlist_settings" as any)
          .insert(payload)
          .select()
          .single() as any);
        if (data) {
          setSettings(prev => ({ ...prev, id: data.id }));
        }
      }
      toast.success("Configurações salvas");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="w-4 h-4" />
          Configurações da Playlist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Playback Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Modo de Reprodução</Label>
            <RadioGroup
              value={settings.playback_mode}
              onValueChange={(v) => updateSettings({ playback_mode: v as PlaylistSettingsData['playback_mode'] })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sequential" id="sequential" />
                <Label htmlFor="sequential" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Play className="w-4 h-4" />
                  Sequencial
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="random" id="random" />
                <Label htmlFor="random" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Shuffle className="w-4 h-4" />
                  Aleatório
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="loop" id="loop" />
                <Label htmlFor="loop" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Repeat className="w-4 h-4" />
                  Loop infinito
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Default Duration */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tempo Padrão por Slide</Label>
            <Select
              value={settings.default_duration.toString()}
              onValueChange={(v) => updateSettings({ default_duration: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Slides individuais podem ter tempo personalizado
            </p>
          </div>

          {/* Transition Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Transição</Label>
            <Select
              value={settings.transition_type}
              onValueChange={(v) => updateSettings({ transition_type: v as PlaylistSettingsData['transition_type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSITION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Transições suaves e elegantes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}