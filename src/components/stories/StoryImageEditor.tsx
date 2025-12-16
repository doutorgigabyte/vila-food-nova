import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RotateCcw, ZoomIn, Move } from 'lucide-react';

interface ImageAdjustments {
  scale: number;
  positionX: number;
  positionY: number;
}

interface StoryImageEditorProps {
  imageUrl: string;
  adjustments: ImageAdjustments;
  onAdjustmentsChange: (adjustments: ImageAdjustments) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const StoryImageEditor: React.FC<StoryImageEditorProps> = ({
  imageUrl,
  adjustments,
  onAdjustmentsChange,
  onConfirm,
  onBack
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleReset = () => {
    onAdjustmentsChange({
      scale: 1,
      positionX: 50,
      positionY: 50
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = (e.clientX - dragStart.x) * 0.2;
    const deltaY = (e.clientY - dragStart.y) * 0.2;
    
    onAdjustmentsChange({
      ...adjustments,
      positionX: Math.max(0, Math.min(100, adjustments.positionX + deltaX)),
      positionY: Math.max(0, Math.min(100, adjustments.positionY + deltaY))
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Preview */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black/20">
        <div
          ref={containerRef}
          className="relative w-full max-w-[280px] aspect-[9/16] rounded-2xl overflow-hidden cursor-move bg-black"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Preview"
            className="absolute w-full h-full object-cover transition-transform"
            style={{
              transform: `scale(${adjustments.scale})`,
              objectPosition: `${adjustments.positionX}% ${adjustments.positionY}%`
            }}
            draggable={false}
          />
          
          {/* Overlay guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="text-white/50 flex flex-col items-center gap-2">
              <Move className="h-8 w-8" />
              <span className="text-sm">Arraste para posicionar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 border-t border-border bg-background">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              Zoom: {Math.round(adjustments.scale * 100)}%
            </Label>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Resetar
            </Button>
          </div>
          <Slider
            value={[adjustments.scale]}
            onValueChange={([value]) => onAdjustmentsChange({ ...adjustments, scale: value })}
            min={1}
            max={2}
            step={0.05}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Posição Horizontal: {Math.round(adjustments.positionX)}%</Label>
          <Slider
            value={[adjustments.positionX]}
            onValueChange={([value]) => onAdjustmentsChange({ ...adjustments, positionX: value })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Posição Vertical: {Math.round(adjustments.positionY)}%</Label>
          <Slider
            value={[adjustments.positionY]}
            onValueChange={([value]) => onAdjustmentsChange({ ...adjustments, positionY: value })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};
