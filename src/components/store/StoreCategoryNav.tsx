import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Star, 
  Grid3X3,
  Cake,
  Pizza,
  Sandwich,
  Beef,
  Fish,
  Salad,
  IceCream,
  Coffee,
  Wine,
  Beer,
  GlassWater,
  Cookie,
  Croissant,
  Soup,
  Drumstick,
  Apple,
  Candy,
  CakeSlice,
  Utensils,
  ShoppingBasket,
  UtensilsCrossed,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";

// Map category names to icons
const categoryIconMap: Record<string, LucideIcon> = {
  // Doces e Bolos
  "bolo": Cake,
  "bolos": Cake,
  "torta": CakeSlice,
  "tortas": CakeSlice,
  "doce": Candy,
  "doces": Candy,
  "sobremesa": IceCream,
  "sobremesas": IceCream,
  "sorvete": IceCream,
  "sorvetes": IceCream,
  "cookie": Cookie,
  "cookies": Cookie,
  "biscoito": Cookie,
  "biscoitos": Cookie,
  "brigadeiro": Candy,
  "brigadeiros": Candy,
  "trufa": Candy,
  "trufas": Candy,
  "pudim": CakeSlice,
  "pudins": CakeSlice,
  
  // Bebidas
  "bebida": GlassWater,
  "bebidas": GlassWater,
  "refrigerante": GlassWater,
  "refrigerantes": GlassWater,
  "suco": GlassWater,
  "sucos": GlassWater,
  "café": Coffee,
  "cafes": Coffee,
  "coffee": Coffee,
  "vinho": Wine,
  "vinhos": Wine,
  "cerveja": Beer,
  "cervejas": Beer,
  "drink": Wine,
  "drinks": Wine,
  "coquetel": Wine,
  "coqueteis": Wine,
  "agua": GlassWater,
  "água": GlassWater,
  "chá": Coffee,
  "chas": Coffee,
  
  // Comidas
  "pizza": Pizza,
  "pizzas": Pizza,
  "hamburguer": Sandwich,
  "hamburguers": Sandwich,
  "hambúrguer": Sandwich,
  "hambúrgueres": Sandwich,
  "burger": Sandwich,
  "burgers": Sandwich,
  "lanche": Sandwich,
  "lanches": Sandwich,
  "sanduiche": Sandwich,
  "sanduíche": Sandwich,
  "sanduiches": Sandwich,
  "sanduíches": Sandwich,
  "carne": Beef,
  "carnes": Beef,
  "churrasco": Beef,
  "churrascos": Beef,
  "peixe": Fish,
  "peixes": Fish,
  "frutos do mar": Fish,
  "seafood": Fish,
  "camarão": Fish,
  "camarões": Fish,
  "sushi": Fish,
  "sashimi": Fish,
  "japonesa": Fish,
  "salada": Salad,
  "saladas": Salad,
  "vegetariano": Salad,
  "vegano": Salad,
  "fit": Salad,
  "sopa": Soup,
  "sopas": Soup,
  "caldo": Soup,
  "caldos": Soup,
  "frango": Drumstick,
  "frangos": Drumstick,
  "galinha": Drumstick,
  "aves": Drumstick,
  "croissant": Croissant,
  "padaria": Croissant,
  "pães": Croissant,
  "pao": Croissant,
  "pão": Croissant,
  "fruta": Apple,
  "frutas": Apple,
  "açaí": Apple,
  "acai": Apple,
  
  // Genéricos
  "entrada": Utensils,
  "entradas": Utensils,
  "petisco": Utensils,
  "petiscos": Utensils,
  "acompanhamento": UtensilsCrossed,
  "acompanhamentos": UtensilsCrossed,
  "prato": UtensilsCrossed,
  "pratos": UtensilsCrossed,
  "principal": UtensilsCrossed,
  "principais": UtensilsCrossed,
  "refeição": UtensilsCrossed,
  "refeicao": UtensilsCrossed,
  "combo": ShoppingBasket,
  "combos": ShoppingBasket,
  "kit": ShoppingBasket,
  "kits": ShoppingBasket,
  "promoção": Flame,
  "promocao": Flame,
  "oferta": Flame,
  "ofertas": Flame,
};

const getCategoryIcon = (name: string): LucideIcon | null => {
  const normalizedName = name.toLowerCase().trim();
  
  // Direct match
  if (categoryIconMap[normalizedName]) {
    return categoryIconMap[normalizedName];
  }
  
  // Partial match
  for (const [key, icon] of Object.entries(categoryIconMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return icon;
    }
  }
  
  return null;
};

interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
}

interface StoreCategoryNavProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  hasPromotions?: boolean;
  hasFeatured?: boolean;
  promoCount?: number;
  featuredCount?: number;
}

export const StoreCategoryNav = ({
  categories,
  selectedCategory,
  onSelectCategory,
  hasPromotions,
  hasFeatured,
  promoCount = 0,
  featuredCount = 0,
}: StoreCategoryNavProps) => {
  const { scrollRef, isDragging, handlers, scroll, wasClick } = useDragScroll({
    momentum: true,
    friction: 0.92,
  });

  const allTabs = [
    { id: null, name: "TODAS", icon: Grid3X3, count: null },
    ...(hasPromotions ? [{ id: "promocoes", name: "PROMOÇÕES", icon: Flame, count: promoCount }] : []),
    ...(hasFeatured ? [{ id: "destaques", name: "DESTAQUES", icon: Star, count: featuredCount }] : []),
    ...categories.map((cat) => ({ 
      id: cat.id, 
      name: cat.name.toUpperCase(), 
      icon: getCategoryIcon(cat.name), 
      count: cat.count 
    })),
  ];

  const handleTabClick = (tabId: string | null) => {
    // Only trigger click if not dragging
    if (wasClick()) {
      onSelectCategory(tabId);
    }
  };

  return (
    <div className="relative mx-4 my-4">
      {/* Desktop Navigation Arrows */}
      <button
        onClick={() => scroll("left", 200)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 bg-card shadow-md rounded-full items-center justify-center z-10 hover:bg-muted transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => scroll("right", 200)}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 bg-card shadow-md rounded-full items-center justify-center z-10 hover:bg-muted transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Categories with drag scroll */}
      <div
        ref={scrollRef}
        {...handlers}
        className={cn(
          "flex gap-2 overflow-x-auto py-1 select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ 
          scrollSnapType: isDragging ? "none" : "x mandatory",
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {allTabs.map((tab) => {
          const isActive = selectedCategory === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id || "all"}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all shrink-0 touch-manipulation active:scale-95",
                "border min-w-[80px]",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lg"
                  : "bg-card hover:bg-muted border-border"
              )}
              style={{ scrollSnapAlign: "start" }}
            >
              {IconComponent && <IconComponent className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />}
              <span className="text-[10px] font-semibold whitespace-nowrap tracking-wide">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};