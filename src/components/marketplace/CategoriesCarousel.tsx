import { ChevronLeft, ChevronRight, Pizza, Beef, Utensils, Sandwich, IceCream, Croissant, Grape, Fish, Package, CupSoda, Store, ShoppingBag, Pill, Laptop, Home, Shirt, Sparkles, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSegments } from "@/hooks/useSegments";
import { useDragScroll } from "@/hooks/useDragScroll";
import { LucideIcon } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

const defaultCategories: CategoryItem[] = [
  { id: "acai", name: "Açaí", icon: Grape, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
  { id: "alimentacao", name: "Alimentação", icon: Utensils, bgColor: "bg-green-100", iconColor: "text-green-600" },
  { id: "bebidas", name: "Bebidas", icon: CupSoda, bgColor: "bg-amber-100", iconColor: "text-amber-600" },
  { id: "beleza", name: "Beleza", icon: Sparkles, bgColor: "bg-pink-100", iconColor: "text-pink-600" },
  { id: "casa", name: "Casa e Jardim", icon: Home, bgColor: "bg-blue-100", iconColor: "text-blue-600" },
  { id: "eletronicos", name: "Eletrônicos", icon: Laptop, bgColor: "bg-cyan-100", iconColor: "text-cyan-600" },
  { id: "farmacia", name: "Farmácia", icon: Pill, bgColor: "bg-red-100", iconColor: "text-red-600" },
  { id: "hamburgueria", name: "Hamburgueria", icon: Sandwich, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
  { id: "lanchonete", name: "Lanchonete", icon: Package, bgColor: "bg-yellow-100", iconColor: "text-yellow-600" },
  { id: "marmitaria", name: "Marmitaria", icon: Beef, bgColor: "bg-rose-100", iconColor: "text-rose-600" },
  { id: "moda", name: "Moda", icon: Shirt, bgColor: "bg-indigo-100", iconColor: "text-indigo-600" },
  { id: "outros", name: "Outros", icon: MoreHorizontal, bgColor: "bg-gray-100", iconColor: "text-gray-600" },
  { id: "padaria", name: "Padaria", icon: Croissant, bgColor: "bg-amber-100", iconColor: "text-amber-700" },
];

const iconMap: Record<string, LucideIcon> = {
  pizza: Pizza,
  beef: Beef,
  utensils: Utensils,
  sandwich: Sandwich,
  "ice-cream": IceCream,
  croissant: Croissant,
  grape: Grape,
  fish: Fish,
  package: Package,
  "cup-soda": CupSoda,
  sparkles: Sparkles,
  pill: Pill,
  laptop: Laptop,
  home: Home,
  shirt: Shirt,
  "shopping-bag": ShoppingBag,
  "more-horizontal": MoreHorizontal,
};

const colorMap: Record<string, { bg: string; icon: string }> = {
  pizza: { bg: "bg-orange-100", icon: "text-orange-600" },
  beef: { bg: "bg-red-100", icon: "text-red-600" },
  utensils: { bg: "bg-green-100", icon: "text-green-600" },
  sandwich: { bg: "bg-yellow-100", icon: "text-yellow-700" },
  "ice-cream": { bg: "bg-pink-100", icon: "text-pink-600" },
  croissant: { bg: "bg-amber-100", icon: "text-amber-700" },
  grape: { bg: "bg-purple-100", icon: "text-purple-600" },
  fish: { bg: "bg-cyan-100", icon: "text-cyan-600" },
  package: { bg: "bg-emerald-100", icon: "text-emerald-600" },
  "cup-soda": { bg: "bg-blue-100", icon: "text-blue-600" },
  sparkles: { bg: "bg-pink-100", icon: "text-pink-600" },
  pill: { bg: "bg-red-100", icon: "text-red-600" },
  laptop: { bg: "bg-cyan-100", icon: "text-cyan-600" },
  home: { bg: "bg-blue-100", icon: "text-blue-600" },
  shirt: { bg: "bg-indigo-100", icon: "text-indigo-600" },
  "shopping-bag": { bg: "bg-rose-100", icon: "text-rose-600" },
};

interface CategoriesCarouselProps {
  onCategoryClick?: (categoryId: string) => void;
}

const CategoriesCarousel = ({ onCategoryClick }: CategoriesCarouselProps) => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const { segments, loading } = useSegments();

  // Use segments from database or default categories
  const categories: CategoryItem[] = segments.length > 0 
    ? segments.map((segment, index) => {
        const iconKey = segment.icon || "";
        const colors = colorMap[iconKey] || { bg: "bg-gray-100", icon: "text-gray-600" };
        const IconComp = iconMap[iconKey] || defaultCategories[index % defaultCategories.length]?.icon || Store;
        return {
          id: segment.id,
          name: segment.name,
          icon: IconComp,
          bgColor: colors.bg,
          iconColor: colors.icon,
        };
      })
    : defaultCategories;

  if (loading) {
    return (
      <section className="py-6 md:py-8 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">O que você está buscando?</h2>
          <div className="flex gap-4 md:gap-6 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-muted animate-pulse" />
                <div className="w-14 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">O que você está buscando?</h2>
        
        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={scrollRef}
            {...handlers}
            className={`flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => {
              const IconComponent = category.icon;
              
              return (
                <button
                  key={category.id}
                  onClick={() => !isDragging && onCategoryClick?.(category.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group/item touch-feedback"
                >
                  <div 
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${category.bgColor} flex items-center justify-center transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-lg active:scale-95 shadow-soft`}
                  >
                    <IconComponent className={`w-8 h-8 md:w-10 md:h-10 ${category.iconColor}`} />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center max-w-[70px] md:max-w-[80px] leading-tight">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesCarousel;
