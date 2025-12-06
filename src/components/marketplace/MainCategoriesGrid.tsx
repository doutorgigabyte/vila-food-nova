import { useState } from "react";
import { 
  ShoppingCart, 
  Pill, 
  ShoppingBag, 
  UtensilsCrossed, 
  Package,
  Palette,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MainCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  description?: string;
}

export const mainCategories: MainCategory[] = [
  { 
    id: "mercado", 
    name: "Mercado", 
    icon: ShoppingCart, 
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
    description: "Supermercados e mercearias"
  },
  { 
    id: "farmacia", 
    name: "Farmácia", 
    icon: Pill, 
    bgColor: "bg-red-50",
    iconColor: "text-red-500",
    description: "Medicamentos e saúde"
  },
  { 
    id: "compras", 
    name: "Compras", 
    icon: ShoppingBag, 
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    description: "Lojas e varejo"
  },
  { 
    id: "comida", 
    name: "Comida", 
    icon: UtensilsCrossed, 
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
    description: "Restaurantes e lanches"
  },
  { 
    id: "artesanato", 
    name: "Artesanato", 
    icon: Palette, 
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    description: "Artesãos locais - Grátis por 1 ano!"
  },
  { 
    id: "servicos", 
    name: "Serviços", 
    icon: Package, 
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    description: "Entregas e serviços"
  },
];

// Mapeamento de segmentos para categorias principais
export const segmentToCategoryMap: Record<string, string> = {
  // Comida
  "pizzaria": "comida",
  "hamburgueria": "comida",
  "lanchonete": "comida",
  "restaurante": "comida",
  "marmitaria": "comida",
  "padaria": "comida",
  "confeitaria": "comida",
  "doceria": "comida",
  "acai": "comida",
  "sorveteria": "comida",
  "cafeteria": "comida",
  "bar": "comida",
  "sushi": "comida",
  "churrascaria": "comida",
  "pastelaria": "comida",
  "tapiocaria": "comida",
  // Mercado
  "mercado": "mercado",
  "supermercado": "mercado",
  "mercearia": "mercado",
  "hortifruti": "mercado",
  "acougue": "mercado",
  "peixaria": "mercado",
  "bebidas": "mercado",
  "adega": "mercado",
  // Farmácia
  "farmacia": "farmacia",
  "drogaria": "farmacia",
  // Compras
  "loja": "compras",
  "moda": "compras",
  "eletronicos": "compras",
  "casa": "compras",
  "pet": "compras",
  "beleza": "compras",
  "cosmeticos": "compras",
  "brinquedos": "compras",
  "papelaria": "compras",
  "livraria": "compras",
  // Artesanato
  "artesanato": "artesanato",
  "arte": "artesanato",
  "decoracao": "artesanato",
  // Serviços
  "servicos": "servicos",
  "entrega": "servicos",
  "outros": "servicos",
};

interface MainCategoriesGridProps {
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

const MainCategoriesGrid = ({ selectedCategory, onCategorySelect }: MainCategoriesGridProps) => {
  return (
    <section className="py-6 md:py-8 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {mainCategories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect(isSelected ? null : category.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl transition-all duration-300 touch-feedback",
                  "border-2 hover:shadow-lg active:scale-95",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : `border-transparent ${category.bgColor} hover:border-primary/30`
                )}
              >
                <div className={cn(
                  "w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-3 transition-transform",
                  isSelected ? "scale-110" : "",
                  category.bgColor
                )}>
                  <IconComponent className={cn("w-6 h-6 md:w-8 md:h-8", category.iconColor)} />
                </div>
                <span className={cn(
                  "text-xs md:text-sm font-semibold text-center",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {category.name}
                </span>
                {category.id === "artesanato" && (
                  <span className="text-[10px] text-purple-600 font-medium mt-1 bg-purple-100 px-2 py-0.5 rounded-full">
                    Grátis!
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MainCategoriesGrid;
