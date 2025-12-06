import { Pizza, Wine, Package, Snowflake, Layers, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductType = 'single' | 'pizza' | 'drink' | 'combo' | 'frozen' | 'fresh';

interface ProductTypeSelectorProps {
  value: ProductType;
  onChange: (type: ProductType) => void;
}

const productTypes = [
  { type: 'single' as const, label: 'Produto Simples', icon: ShoppingBag, description: 'Produto único sem variações' },
  { type: 'pizza' as const, label: 'Pizza', icon: Pizza, description: 'Com tamanhos e sabores' },
  { type: 'drink' as const, label: 'Bebida', icon: Wine, description: 'Com opção gelada/ambiente' },
  { type: 'combo' as const, label: 'Combo/Kit', icon: Layers, description: 'Leve + Pague -' },
  { type: 'frozen' as const, label: 'Congelado', icon: Snowflake, description: 'Produto congelado' },
  { type: 'fresh' as const, label: 'Fresco/In Natura', icon: Package, description: 'Produto refrigerado' },
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
