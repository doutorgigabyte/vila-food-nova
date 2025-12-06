import { useState } from "react";
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
  X,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MainCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  borderColor: string;
  description?: string;
  imageUrl?: string;
}

export const mainCategories: MainCategory[] = [
  { 
    id: "mercado", 
    name: "Mercado", 
    icon: ShoppingCart, 
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-400",
    description: "Supermercados e mercearias",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop"
  },
  { 
    id: "farmacia", 
    name: "Farmácia", 
    icon: Pill, 
    bgColor: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-red-500 dark:text-red-400",
    borderColor: "border-red-400",
    description: "Medicamentos e saúde",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop"
  },
  { 
    id: "compras", 
    name: "Compras", 
    icon: ShoppingBag, 
    bgColor: "bg-green-100 dark:bg-green-900/40",
    iconColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-400",
    description: "Lojas e varejo",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop"
  },
  { 
    id: "comida", 
    name: "Comida", 
    icon: UtensilsCrossed, 
    bgColor: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-400",
    description: "Restaurantes e lanches",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop"
  },
  { 
    id: "artesanato", 
    name: "Artesanato", 
    icon: Palette, 
    bgColor: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-400",
    description: "Artesãos locais",
    imageUrl: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=100&h=100&fit=crop"
  },
  { 
    id: "servicos", 
    name: "Serviços", 
    icon: Package, 
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-400",
    description: "Entregas e serviços",
    imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=100&h=100&fit=crop"
  },
];

// Mapeamento de segmentos para categorias principais
// Includes all segments from the database
export const segmentToCategoryMap: Record<string, string> = {
  // Comida - Food related
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
  "alimentacao": "comida",
  "docesebolos": "comida",
  "doces": "comida",
  "bolos": "comida",
  "tortas": "comida",
  "lanches": "comida",
  "comida": "comida",
  
  // Mercado - Market/Grocery
  "mercado": "mercado",
  "supermercado": "mercado",
  "mercearia": "mercado",
  "hortifruti": "mercado",
  "acougue": "mercado",
  "peixaria": "mercado",
  "bebidas": "mercado",
  "adega": "mercado",
  "suplementos": "mercado",
  "naturais": "mercado",
  "organicos": "mercado",
  
  // Farmácia - Pharmacy
  "farmacia": "farmacia",
  "drogaria": "farmacia",
  "saude": "farmacia",
  "medicamentos": "farmacia",
  
  // Compras - Shopping
  "loja": "compras",
  "moda": "compras",
  "eletronicos": "compras",
  "casa": "compras",
  "pet": "compras",
  "petshop": "compras",
  "beleza": "compras",
  "cosmeticos": "compras",
  "brinquedos": "compras",
  "papelaria": "compras",
  "livraria": "compras",
  "casaejardim": "compras",
  "jardim": "compras",
  "moveis": "compras",
  "utilidades": "compras",
  "variedades": "compras",
  "calcados": "compras",
  "roupas": "compras",
  "acessorios": "compras",
  "joias": "compras",
  "relogios": "compras",
  "esportes": "compras",
  "ferramentas": "compras",
  "automotivo": "compras",
  "informatica": "compras",
  "celulares": "compras",
  "games": "compras",
  
  // Artesanato - Crafts
  "artesanato": "artesanato",
  "arte": "artesanato",
  "decoracao": "artesanato",
  "handmade": "artesanato",
  "artesanal": "artesanato",
  "croche": "artesanato",
  "bordado": "artesanato",
  "pintura": "artesanato",
  "ceramica": "artesanato",
  "madeira": "artesanato",
  
  // Serviços - Services
  "servicos": "servicos",
  "entrega": "servicos",
  "outros": "servicos",
  "freelancer": "servicos",
  "manutencao": "servicos",
  "limpeza": "servicos",
  "transporte": "servicos",
  "tecnologia": "servicos",
  "consultoria": "servicos",
};

interface MainCategoriesGridProps {
  selectedCategory?: string | null;
  onCategorySelect?: (categoryId: string | null) => void;
}

const MainCategoriesGrid = ({ selectedCategory, onCategorySelect }: MainCategoriesGridProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get the selected category config for theming
  const selectedCategoryConfig = mainCategories.find(c => c.id === selectedCategory);

  const handleCategoryClick = (categoryId: string) => {
    // Toggle: if already selected, deselect; otherwise select
    if (selectedCategory === categoryId) {
      onCategorySelect?.(null);
    } else {
      onCategorySelect?.(categoryId);
    }
    // Close expanded view when selecting
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  const toggleExpand = () => {
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <section className={cn(
      "py-2 transition-colors duration-300",
      selectedCategoryConfig 
        ? `${selectedCategoryConfig.bgColor.replace('100', '50').replace('900/40', '950/20')}` 
        : "bg-gradient-to-b from-primary/5 to-transparent"
    )}>
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
            <div className="flex items-center justify-center gap-1 md:gap-1.5 py-1">
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
                      "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shadow-sm border-2",
                      isSelected 
                        ? `${category.borderColor} scale-110 shadow-md` 
                        : "border-transparent",
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
              
              {/* "Ver Todas" button at the end */}
              <button
                onClick={toggleExpand}
                className="flex items-center justify-center shrink-0 transition-all duration-200 touch-feedback select-none active:scale-95"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted/80 flex items-center justify-center shadow-sm border-2 border-transparent hover:border-primary/30">
                  <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                </div>
              </button>
            </div>
          </div>

          {/* Centered expand arrow below icons */}
          <div className="flex justify-center mt-1">
            <button
              onClick={toggleExpand}
              className={cn(
                "w-6 h-6 rounded-full bg-muted/40 flex items-center justify-center",
                "hover:bg-muted transition-all touch-feedback active:scale-95",
                "hover:scale-110"
              )}
            >
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
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
                      ? `${category.borderColor} ${category.bgColor} shadow-md` 
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
                    isSelected ? category.iconColor : "text-foreground"
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
