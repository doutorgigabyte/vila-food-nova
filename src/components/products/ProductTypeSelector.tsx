import { Pizza, Wine, Package, Snowflake, Layers, ShoppingBag, Wrench, Download, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductType = 'single' | 'pizza' | 'drink' | 'combo' | 'frozen' | 'fresh' | 'service' | 'digital' | 'perishable';

export type ProductCategory = 'physical' | 'digital' | 'perishable' | 'service';

interface ProductTypeSelectorProps {
  value: ProductType;
  onChange: (type: ProductType) => void;
}

const productTypes = [
  { type: 'single' as const, label: 'Produto Simples', icon: ShoppingBag, description: 'Produto único sem variações', category: 'physical' as const },
  { type: 'pizza' as const, label: 'Pizza', icon: Pizza, description: 'Com tamanhos e sabores', category: 'physical' as const },
  { type: 'drink' as const, label: 'Bebida', icon: Wine, description: 'Com opção gelada/ambiente', category: 'physical' as const },
  { type: 'combo' as const, label: 'Combo/Kit', icon: Layers, description: 'Leve + Pague -', category: 'physical' as const },
  { type: 'frozen' as const, label: 'Congelado', icon: Snowflake, description: 'Produto congelado', category: 'physical' as const },
  { type: 'fresh' as const, label: 'Fresco/In Natura', icon: Package, description: 'Produto refrigerado', category: 'physical' as const },
  { type: 'service' as const, label: 'Serviço', icon: Wrench, description: 'Agendamento e atendimento', category: 'service' as const },
  { type: 'digital' as const, label: 'Digital', icon: Download, description: 'Download ou acesso online', category: 'digital' as const },
  { type: 'perishable' as const, label: 'Perecível', icon: Leaf, description: 'Com validade e conservação', category: 'perishable' as const },
];

export const ProductTypeSelector = ({ value, onChange }: ProductTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {productTypes.map(({ type, label, icon: Icon, description }) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            "hover:border-primary/50 hover:bg-primary/5",
            value === type 
              ? "border-primary bg-primary/10 text-primary" 
              : "border-border bg-card text-muted-foreground"
          )}
        >
          <Icon className="w-8 h-8" />
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-center opacity-70">{description}</span>
        </button>
      ))}
    </div>
  );
};

// Helper to get category from product type
export const getProductCategory = (type: ProductType): ProductCategory => {
  const found = productTypes.find(pt => pt.type === type);
  return found?.category || 'physical';
};
