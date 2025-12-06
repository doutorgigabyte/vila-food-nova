import { ChevronLeft, ChevronRight, Pizza, Beef, Utensils, Sandwich, IceCream, Croissant, Grape, Fish, Package, CupSoda, Store, ShoppingBag, Pill, Laptop, Home, Shirt, Sparkles, MoreHorizontal, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSegments } from "@/hooks/useSegments";
import { useDragScroll } from "@/hooks/useDragScroll";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { segmentToCategoryMap } from "./MainCategoriesGrid";

interface CategoryItem {
  id: string;
  name: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

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
  palette: Palette,
  box: Package,
  smartphone: Laptop,
  dog: Package,
  wrench: Package,
  "shopping-cart": ShoppingBag,
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
  palette: { bg: "bg-purple-100", icon: "text-purple-600" },
  box: { bg: "bg-gray-100", icon: "text-gray-600" },
  smartphone: { bg: "bg-cyan-100", icon: "text-cyan-600" },
  dog: { bg: "bg-amber-100", icon: "text-amber-600" },
  wrench: { bg: "bg-slate-100", icon: "text-slate-600" },
  "shopping-cart": { bg: "bg-green-100", icon: "text-green-600" },
};

interface CategoriesCarouselProps {
  mainCategory?: string | null;
  selectedCategory?: string | null;
  onCategoryClick?: (categoryId: string) => void;
}

const CategoriesCarousel = ({ mainCategory, selectedCategory, onCategoryClick }: CategoriesCarouselProps) => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const { segments, loading } = useSegments();

  // Filter segments by main category if provided
  const filteredSegments = mainCategory 
    ? segments.filter(segment => {
        const segmentKey = segment.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
        const mappedCategory = segmentToCategoryMap[segmentKey];
        return mappedCategory === mainCategory;
      })
    : segments;

  // Map segments to category items
  const categories: CategoryItem[] = filteredSegments.map((segment) => {
    const iconKey = segment.icon || "";
    const colors = colorMap[iconKey] || { bg: "bg-gray-100", icon: "text-gray-600" };
    const IconComp = iconMap[iconKey] || Store;
    return {
      id: segment.id,
      name: segment.name,
      icon: IconComp,
      bgColor: colors.bg,
      iconColor: colors.icon,
    };
  });

  if (loading) {
    return (
      <section className="py-4 md:py-6 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 md:gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted animate-pulse" />
                <div className="w-12 h-3 bg-muted rounded animate-pulse" />
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

  const title = mainCategory 
    ? `Subcategorias`
    : "Todas as Categorias";

  return (
    <section className="py-4 md:py-6 bg-card">
      <div className="container mx-auto px-4">
        <h3 className="text-sm md:text-base font-semibold mb-3 md:mb-4 text-muted-foreground">
          {title}
        </h3>
        
        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex h-8 w-8"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => !isDragging && onCategoryClick?.(category.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 group/item touch-feedback"
                >
                  <div 
                    className={cn(
                      "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                      "group-hover/item:scale-110 group-hover/item:shadow-lg active:scale-95",
                      isSelected 
                        ? "ring-2 ring-primary ring-offset-2 shadow-md" 
                        : "shadow-soft",
                      category.bgColor
                    )}
                  >
                    <IconComponent className={cn("w-7 h-7 md:w-8 md:h-8", category.iconColor)} />
                  </div>
                  <span className={cn(
                    "text-[10px] md:text-xs font-medium text-center max-w-[60px] md:max-w-[70px] leading-tight",
                    isSelected ? "text-primary font-semibold" : ""
                  )}>
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card hidden md:flex h-8 w-8"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesCarousel;
