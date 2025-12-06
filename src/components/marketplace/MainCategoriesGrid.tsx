import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingCart, 
  Pill, 
  ShoppingBag, 
  UtensilsCrossed, 
  Package,
  Palette,
  LucideIcon,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MainCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  description?: string;
  imageUrl?: string;
}

export const mainCategories: MainCategory[] = [
  { 
    id: "mercado", 
    name: "Mercado", 
    icon: ShoppingCart, 
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    description: "Supermercados e mercearias",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop"
  },
  { 
    id: "farmacia", 
    name: "Farmácia", 
    icon: Pill, 
    bgColor: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-500 dark:text-red-400",
    description: "Medicamentos e saúde",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop"
  },
  { 
    id: "compras", 
    name: "Compras", 
    icon: ShoppingBag, 
    bgColor: "bg-green-50 dark:bg-green-950/30",
    iconColor: "text-green-600 dark:text-green-400",
    description: "Lojas e varejo",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop"
  },
  { 
    id: "comida", 
    name: "Comida", 
    icon: UtensilsCrossed, 
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    description: "Restaurantes e lanches",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop"
  },
  { 
    id: "artesanato", 
    name: "Artesanato", 
    icon: Palette, 
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    description: "Artesãos locais",
    imageUrl: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=100&h=100&fit=crop"
  },
  { 
    id: "servicos", 
    name: "Serviços", 
    icon: Package, 
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    description: "Entregas e serviços",
    imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=100&h=100&fit=crop"
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
  selectedCategory?: string | null;
  onCategorySelect?: (categoryId: string | null) => void;
}

const MainCategoriesGrid = ({ selectedCategory, onCategorySelect }: MainCategoriesGridProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/categoria/${categoryId}`);
  };

  const toggleExpand = () => {
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <section className="py-2 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container mx-auto px-4">
        {/* Miniature View (Collapsed) */}
        <div 
          className={cn(
            "overflow-hidden transition-all duration-500 ease-out",
            isExpanded ? "max-h-0 opacity-0 pointer-events-none" : "max-h-40 opacity-100"
          )}
        >
          {/* Compact category icons - smaller and centered */}
          <div className="flex justify-center">
            <div className="flex items-center justify-center gap-1.5 md:gap-2 py-1">
              {mainCategories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={cn(
                      "flex items-center justify-center shrink-0 transition-all duration-200 touch-feedback select-none",
                      "active:scale-95"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all shadow-sm",
                      isSelected 
                        ? "ring-2 ring-primary ring-offset-1 scale-105" 
                        : "",
                      category.bgColor
                    )}>
                      {category.imageUrl ? (
                        <img 
                          src={category.imageUrl} 
                          alt={category.name}
                          className="w-full h-full rounded-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <IconComponent className={cn("w-4 h-4 md:w-5 md:h-5", category.iconColor)} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Centered expand arrow below icons */}
          <div className="flex justify-center mt-1.5">
            <button
              onClick={toggleExpand}
              className={cn(
                "w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center",
                "hover:bg-muted transition-all touch-feedback active:scale-95",
                "hover:scale-110 shadow-sm border border-border/50"
              )}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Expanded View */}
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold animate-fade-up">
              O que você procura hoje?
            </h2>
            <button
              onClick={toggleExpand}
              className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-all touch-feedback active:scale-95 hover:rotate-90 duration-300"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          {/* Full Grid with Elastic Animation */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {mainCategories.map((category, index) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  style={{
                    animationDelay: isExpanded && isAnimating ? `${index * 50}ms` : '0ms',
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl transition-all duration-300 touch-feedback select-none",
                    "border-2 hover:shadow-lg active:scale-95",
                    isSelected 
                      ? "border-primary bg-primary/5 shadow-md" 
                      : `border-transparent ${category.bgColor} hover:border-primary/30`,
                    isExpanded && isAnimating && "animate-rubber-band"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 md:mb-3 transition-transform overflow-hidden",
                    isSelected ? "scale-110" : "",
                    category.bgColor
                  )}>
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <IconComponent className={cn("w-7 h-7 md:w-8 md:h-8", category.iconColor)} />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs md:text-sm font-semibold text-center select-none",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {category.name}
                  </span>
                  {category.description && (
                    <span className="text-[10px] text-muted-foreground text-center mt-0.5 hidden md:block select-none">
                      {category.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Collapse button at bottom */}
          <div className="flex justify-center mt-4">
            <button
              onClick={toggleExpand}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors touch-feedback group"
            >
              <ChevronUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
              Fechar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainCategoriesGrid;