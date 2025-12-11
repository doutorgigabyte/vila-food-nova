import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface TemplateOption {
  value: string;
  label: string;
  description: string;
  preview: React.ReactNode;
}

interface TemplatePreviewSelectorProps {
  templates: TemplateOption[];
  value: string;
  onValueChange: (value: string) => void;
}

// Template preview components - mini visual representations
const TemplatePreviewMinimal = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded overflow-hidden">
    <div className="absolute top-1 left-1 w-4 h-2 bg-primary/60 rounded-sm" />
    <div className="absolute bottom-1 right-1 w-3 h-3 bg-white rounded-sm border border-gray-300" />
  </div>
);

const TemplatePreviewProductShowcase = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 rounded overflow-hidden flex">
    <div className="w-1/2 p-1 flex items-center justify-center">
      <div className="w-6 h-6 bg-primary/20 rounded-full" />
    </div>
    <div className="w-1/2 p-1 flex flex-col justify-center gap-0.5">
      <div className="w-full h-1.5 bg-primary/60 rounded-sm" />
      <div className="w-3/4 h-1 bg-gray-300 rounded-sm" />
      <div className="w-1/2 h-1 bg-gray-400 rounded-sm" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary/80" />
  </div>
);

const TemplatePreviewPromo = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 rounded overflow-hidden flex">
    <div className="w-2/5 p-1 flex flex-col justify-center gap-0.5">
      <div className="w-3 h-1.5 bg-amber-400 rounded-full" />
      <div className="w-full h-2 bg-primary/60 rounded-sm" />
      <div className="w-1/2 h-1 bg-gray-400 rounded-sm" />
    </div>
    <div className="w-3/5 p-1 flex items-center justify-center">
      <div className="w-8 h-8 bg-primary/20 rounded-lg" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary/80" />
  </div>
);

const TemplatePreviewFullImage = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded overflow-hidden">
    <div className="absolute inset-2 border-2 border-dashed border-white/50 rounded" />
  </div>
);

const TemplatePreviewBlobModern = () => (
  <div className="relative w-full h-full bg-gray-900 rounded overflow-hidden">
    <div className="absolute top-1 left-1 w-3 h-3 bg-primary/40 rounded-full blur-[2px]" />
    <div className="absolute bottom-2 right-2 w-4 h-4 bg-primary/30 rounded-full blur-[3px]" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-6 h-6 bg-white/90 rounded-full border-2 border-white" />
    </div>
    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-1 bg-white/80 rounded-sm" />
      <div className="w-3 h-0.5 bg-white/50 rounded-sm" />
    </div>
  </div>
);

const TemplatePreviewPolaroid = () => (
  <div className="relative w-full h-full bg-gray-800 rounded overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-6 bg-white rounded-sm transform -rotate-6 shadow-sm">
      <div className="w-full h-4 bg-gray-300" />
    </div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ml-2 w-5 h-6 bg-white rounded-sm transform rotate-3 shadow-sm">
      <div className="w-full h-4 bg-gray-400" />
    </div>
  </div>
);

const TemplatePreviewDiamond = () => (
  <div className="relative w-full h-full bg-amber-50 rounded overflow-hidden">
    <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-primary/30 transform rotate-45" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-primary/40 transform rotate-45" />
    <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-1.5 bg-primary/60 rounded-sm" />
      <div className="w-3 h-1 bg-gray-400 rounded-sm" />
    </div>
    <div className="absolute top-2 right-2 w-3 h-3 bg-red-400 rounded-full flex items-center justify-center">
      <span className="text-[4px] text-white font-bold">%</span>
    </div>
  </div>
);

const TemplatePreviewDiagonal = () => (
  <div className="relative w-full h-full bg-amber-100 rounded overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-0 left-0 w-3/5 h-full bg-gradient-to-r from-gray-300 to-gray-200" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)' }} />
    </div>
    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-2 bg-primary/60 rounded-sm" />
      <div className="w-3 h-1 bg-gray-500 rounded-sm" />
    </div>
    <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
  </div>
);

const TemplatePreviewMenuGrid = () => (
  <div className="relative w-full h-full bg-gray-900 rounded overflow-hidden">
    <div className="absolute top-1 left-1 w-3 h-3 bg-primary/30 rounded-full blur-[2px]" />
    <div className="absolute bottom-1 left-2 grid grid-cols-4 gap-0.5">
      {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-white/80 rounded-full" />)}
    </div>
    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 rounded-full" />
  </div>
);

const TemplatePreviewSpecialDay = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-primary/80 to-primary rounded overflow-hidden">
    <div className="absolute top-2 left-2 w-4 h-4 bg-white/90 rounded-full" />
    <div className="absolute bottom-2 right-2 w-5 h-5 bg-white/80 rounded-full" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full" />
    <div className="absolute top-1 right-2 flex flex-col gap-0.5">
      <div className="w-4 h-1.5 bg-white/90 rounded-sm" />
    </div>
  </div>
);

const TemplatePreviewCatering = () => (
  <div className="relative w-full h-full bg-gray-200 rounded overflow-hidden flex">
    <div className="w-3/5 bg-gradient-to-br from-gray-300 to-gray-400" />
    <div className="w-2/5 bg-primary/80 flex flex-col items-center justify-center gap-0.5 p-1">
      <div className="w-4 h-1 bg-white/90 rounded-sm" />
      <div className="w-3 h-0.5 bg-white/60 rounded-sm" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-100 flex items-center justify-center gap-1 px-1">
      {[1,2,3,4].map(i => <div key={i} className="w-2 h-1.5 bg-gray-300 rounded-sm" />)}
    </div>
  </div>
);

const TemplatePreviewCircles = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-primary/70 to-primary/90 rounded overflow-hidden">
    <div className="absolute top-1/2 -translate-y-1/2 left-2 w-4 h-4 bg-white/90 rounded-full border-2 border-amber-400" />
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-5 h-5 bg-white/90 rounded-full border-2 border-amber-400" />
    <div className="absolute bottom-1/3 right-2 w-4 h-4 bg-white/90 rounded-full border-2 border-amber-400" />
    <div className="absolute top-1 right-1 flex flex-col gap-0.5">
      <div className="w-4 h-1 bg-white/90 rounded-sm" />
    </div>
  </div>
);

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { 
    value: 'minimal', 
    label: 'Minimalista', 
    description: 'Foto fullscreen + logo + QR discreto',
    preview: <TemplatePreviewMinimal />
  },
  { 
    value: 'product_showcase', 
    label: 'Vitrine de Produto', 
    description: 'Foto + nome + preço + QR Code',
    preview: <TemplatePreviewProductShowcase />
  },
  { 
    value: 'promo', 
    label: 'Promoção', 
    description: 'Destaque promocional com preço',
    preview: <TemplatePreviewPromo />
  },
  { 
    value: 'full_image', 
    label: 'Imagem Completa', 
    description: 'Apenas a foto sem moldura',
    preview: <TemplatePreviewFullImage />
  },
  { 
    value: 'blob_modern', 
    label: 'Moderno com Blobs', 
    description: 'Fundo escuro com manchas coloridas',
    preview: <TemplatePreviewBlobModern />
  },
  { 
    value: 'polaroid', 
    label: 'Polaroid', 
    description: 'Fotos inclinadas tipo polaroid',
    preview: <TemplatePreviewPolaroid />
  },
  { 
    value: 'diamond', 
    label: 'Diamante', 
    description: 'Fotos em losango geométrico',
    preview: <TemplatePreviewDiamond />
  },
  { 
    value: 'diagonal', 
    label: 'Diagonal Elegante', 
    description: 'Grid diagonal com tipografia serif',
    preview: <TemplatePreviewDiagonal />
  },
  { 
    value: 'menu_grid', 
    label: 'Menu Completo', 
    description: 'Foto grande + grid de produtos',
    preview: <TemplatePreviewMenuGrid />
  },
  { 
    value: 'special_day', 
    label: 'Especial do Dia', 
    description: 'Vibrante com múltiplos círculos',
    preview: <TemplatePreviewSpecialDay />
  },
  { 
    value: 'catering', 
    label: 'Catering/Evento', 
    description: 'Foto principal + painel lateral',
    preview: <TemplatePreviewCatering />
  },
  { 
    value: 'circles', 
    label: 'Círculos Conectados', 
    description: 'Múltiplas fotos em círculos',
    preview: <TemplatePreviewCircles />
  },
];

export function TemplatePreviewSelector({ templates, value, onValueChange }: TemplatePreviewSelectorProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {templates.map((template) => (
        <button
          key={template.value}
          type="button"
          onClick={() => onValueChange(template.value)}
          className={cn(
            "relative group p-2 rounded-xl border-2 transition-all duration-200 text-left",
            value === template.value
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          {/* Preview */}
          <div className="aspect-video w-full rounded-lg overflow-hidden mb-2">
            {template.preview}
          </div>
          
          {/* Label */}
          <p className={cn(
            "text-xs font-medium truncate",
            value === template.value ? "text-primary" : "text-foreground"
          )}>
            {template.label}
          </p>
          
          {/* Selected indicator */}
          {value === template.value && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
