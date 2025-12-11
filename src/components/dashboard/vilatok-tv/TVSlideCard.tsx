import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Eye, EyeOff, Settings, Trash2, Play, Clock } from "lucide-react";

interface TVSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  product_id: string | null;
  template_type: string;
  sort_order: number;
  is_active: boolean;
  media_type?: string;
  duration_seconds?: number;
  product?: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
  } | null;
}

interface TVSlideCardProps {
  slide: TVSlide;
  index: number;
  getTemplateName: (value: string) => string;
  onToggleActive: (slide: TVSlide) => void;
  onEdit: (slide: TVSlide) => void;
  onDelete: (id: string) => void;
}

export function TVSlideCard({ 
  slide, 
  index, 
  getTemplateName, 
  onToggleActive, 
  onEdit, 
  onDelete 
}: TVSlideCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const isVideo = slide.media_type === 'video' || 
    slide.image_url?.match(/\.(mp4|webm|mov)$/i);

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden group ${!slide.is_active ? 'opacity-50' : ''} ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <div className="relative aspect-video bg-muted">
        {isVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-black/80">
            <Play className="w-12 h-12 text-white/70" />
            <video
              src={slide.image_url}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
              muted
            />
          </div>
        ) : (
          <img
            src={slide.image_url}
            alt={slide.title || 'Slide'}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1.5 bg-background/80 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <Badge variant="secondary" className="text-xs">#{index + 1}</Badge>
          <Badge variant="outline" className="text-xs bg-background/80">
            {getTemplateName(slide.template_type)}
          </Badge>
          {isVideo && (
            <Badge variant="default" className="text-xs bg-primary/80">
              <Play className="w-3 h-3 mr-1" />
              Vídeo
            </Badge>
          )}
        </div>

        {/* Duration Badge */}
        {slide.duration_seconds && (
          <Badge className="absolute bottom-2 right-2 text-xs bg-background/80 text-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {slide.duration_seconds}s
          </Badge>
        )}

        {/* Product Badge */}
        {slide.product && (
          <Badge className="absolute bottom-2 left-2">{slide.product.name}</Badge>
        )}
      </div>

      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="truncate flex-1 min-w-0">
            <p className="font-medium truncate">{slide.title || 'Sem título'}</p>
            {slide.subtitle && (
              <p className="text-xs text-muted-foreground truncate">{slide.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onToggleActive(slide)}>
              {slide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(slide)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(slide.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}