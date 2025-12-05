import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TouchImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
}

export const TouchImageViewer = ({ src, alt, onClose }: TouchImageViewerProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<TouchPoint | null>(null);
  const [dragStart, setDragStart] = useState<TouchPoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch0 = touches.item(0);
    const touch1 = touches.item(1);
    if (!touch0 || !touch1) return 0;
    const dx = touch0.clientX - touch1.clientX;
    const dy = touch0.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touches: React.TouchList): TouchPoint => {
    const touch0 = touches.item(0);
    if (touches.length < 2 || !touch0) {
      return { x: touch0?.clientX || 0, y: touch0?.clientY || 0 };
    }
    const touch1 = touches.item(1);
    if (!touch1) return { x: touch0.clientX, y: touch0.clientY };
    return {
      x: (touch0.clientX + touch1.clientX) / 2,
      y: (touch0.clientY + touch1.clientY) / 2,
    };
  };

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch start
      setLastTouchDistance(getTouchDistance(e.touches));
      setLastTouchCenter(getTouchCenter(e.touches));
    } else if (e.touches.length === 1) {
      // Drag start
      const touch = e.touches.item(0);
      if (touch) {
        setIsDragging(true);
        setDragStart({
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
        });
      }
    }
  }, [position]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2 && lastTouchDistance !== null) {
      // Pinch zoom
      const newDistance = getTouchDistance(e.touches);
      const newCenter = getTouchCenter(e.touches);
      
      // Calculate scale change
      const scaleChange = newDistance / lastTouchDistance;
      const newScale = Math.min(Math.max(scale * scaleChange, 0.5), 5);
      
      setScale(newScale);
      setLastTouchDistance(newDistance);
      setLastTouchCenter(newCenter);
    } else if (e.touches.length === 1 && isDragging && dragStart && scale > 1) {
      // Drag (only when zoomed in)
      const touch = e.touches.item(0);
      if (touch) {
        const newX = touch.clientX - dragStart.x;
        const newY = touch.clientY - dragStart.y;
        
        // Limit drag bounds based on scale
        const maxOffset = (scale - 1) * 150;
        setPosition({
          x: Math.min(Math.max(newX, -maxOffset), maxOffset),
          y: Math.min(Math.max(newY, -maxOffset), maxOffset),
        });
      }
    }
  }, [scale, lastTouchDistance, isDragging, dragStart]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setLastTouchDistance(null);
      setLastTouchCenter(null);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
      setDragStart(null);
    }
  }, []);

  // Handle double tap to zoom
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (scale > 1) {
        // Reset zoom
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        // Zoom in to 2x at tap position
        setScale(2);
      }
    }
    lastTapRef.current = now;
  }, [scale]);

  // Reset view
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom controls
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="text-white hover:bg-white/20 disabled:opacity-50"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <span className="text-sm min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="text-white hover:bg-white/20 disabled:opacity-50"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === containerRef.current) onClose();
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain select-none transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
          draggable={false}
          onTouchEnd={handleDoubleTap}
        />
      </div>

      {/* Instructions */}
      <div className="p-4 text-center text-white/60 text-sm">
        <p>Pinça para zoom • Toque duplo para ampliar • Arraste para mover</p>
      </div>
    </div>
  );
};