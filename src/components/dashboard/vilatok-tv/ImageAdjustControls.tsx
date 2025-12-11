import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw, ZoomIn, Move } from "lucide-react";

interface ImageAdjustControlsProps {
  scale: number;
  positionX: number;
  positionY: number;
  onScaleChange: (value: number) => void;
  onPositionXChange: (value: number) => void;
  onPositionYChange: (value: number) => void;
  onReset: () => void;
}

export function ImageAdjustControls({
  scale,
  positionX,
  positionY,
  onScaleChange,
  onPositionXChange,
  onPositionYChange,
  onReset
}: ImageAdjustControlsProps) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Move className="w-4 h-4" />
          Ajustes da Foto
        </Label>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs">
          <RotateCcw className="w-3 h-3 mr-1" />
          Resetar
        </Button>
      </div>

      {/* Zoom */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <ZoomIn className="w-3 h-3" />
            Zoom
          </Label>
          <span className="text-xs font-mono bg-background px-2 py-0.5 rounded">
            {Math.round(scale * 100)}%
          </span>
        </div>
        <Slider
          value={[scale]}
          min={0.5}
          max={2}
          step={0.05}
          onValueChange={([v]) => onScaleChange(v)}
          className="w-full"
        />
      </div>

      {/* Position X */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Posição Horizontal</Label>
          <span className="text-xs font-mono bg-background px-2 py-0.5 rounded">
            {positionX > 0 ? '+' : ''}{Math.round(positionX)}%
          </span>
        </div>
        <Slider
          value={[positionX]}
          min={-50}
          max={50}
          step={1}
          onValueChange={([v]) => onPositionXChange(v)}
          className="w-full"
        />
      </div>

      {/* Position Y */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Posição Vertical</Label>
          <span className="text-xs font-mono bg-background px-2 py-0.5 rounded">
            {positionY > 0 ? '+' : ''}{Math.round(positionY)}%
          </span>
        </div>
        <Slider
          value={[positionY]}
          min={-50}
          max={50}
          step={1}
          onValueChange={([v]) => onPositionYChange(v)}
          className="w-full"
        />
      </div>
    </div>
  );
}