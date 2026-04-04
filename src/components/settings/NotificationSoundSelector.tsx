import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2, 
  Music,
  Check
} from "lucide-react";

interface SoundOption {
  id: string;
  name: string;
  file: string;
  duration: string;
  type: "curto" | "longo";
}

const AVAILABLE_SOUNDS: SoundOption[] = [
  { id: "new-order", name: "Novo Pedido", file: "/sounds/new-order.mp3", duration: "3s", type: "curto" },
  { id: "order-ready", name: "Pedido Pronto", file: "/sounds/order-ready.mp3", duration: "2s", type: "curto" },
  { id: "new-delivery", name: "Nova Entrega", file: "/sounds/new-delivery.mp3", duration: "3s", type: "curto" },
  { id: "delivery-complete", name: "Entrega Concluída", file: "/sounds/delivery-complete.mp3", duration: "2s", type: "curto" },
  { id: "payment-success", name: "Pagamento Confirmado", file: "/sounds/payment-success.mp3", duration: "2s", type: "curto" },
];

interface NotificationSoundSelectorProps {
  selectedSound: string;
  volume: number;
  onSoundChange: (soundId: string) => void;
  onVolumeChange: (volume: number) => void;
}

export const NotificationSoundSelector = ({
  selectedSound,
  volume,
  onSoundChange,
  onVolumeChange
}: NotificationSoundSelectorProps) => {
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playPreview = (sound: SoundOption) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (playingSound === sound.id) {
      setPlayingSound(null);
      return;
    }

    const audio = new Audio(sound.file);
    audio.volume = volume / 100;
    audioRef.current = audio;

    audio.onended = () => {
      setPlayingSound(null);
    };

    audio.play().catch(console.error);
    setPlayingSound(sound.id);
  };

  const handleSelect = (soundId: string) => {
    onSoundChange(soundId);
    const sound = AVAILABLE_SOUNDS.find(s => s.id === soundId);
    if (sound) {
      playPreview(sound);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Som de Notificação
        </CardTitle>
        <CardDescription>
          Escolha o som que tocará quando receber novos pedidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Volume Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Volume
            </Label>
            <span className="text-sm text-muted-foreground">{volume}%</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={(v) => onVolumeChange(v[0])}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Sound Selection */}
        <RadioGroup value={selectedSound} onValueChange={handleSelect} className="space-y-3">
          {AVAILABLE_SOUNDS.map((sound) => (
            <div 
              key={sound.id}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                selectedSound === sound.id 
                  ? "border-primary bg-primary/5" 
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={sound.id} id={sound.id} />
                <div>
                  <Label htmlFor={sound.id} className="cursor-pointer flex items-center gap-2">
                    {sound.name}
                    {selectedSound === sound.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {sound.duration}
                    </Badge>
                    <Badge 
                      variant={sound.type === "curto" ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {sound.type === "curto" ? "Toque curto" : "Toque longo"}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => playPreview(sound)}
                className="shrink-0"
              >
                {playingSound === sound.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
