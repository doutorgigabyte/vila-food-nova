import { ChevronLeft, ChevronRight, Pizza, Beef, Utensils, Sandwich, IceCream, Croissant, Grape, Fish, Package, CupSoda, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSegments } from "@/hooks/useSegments";
import { useDragScroll } from "@/hooks/useDragScroll";

const iconMap: Record<string, React.ElementType> = {
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
};

const colorMap: Record<string, string> = {
  pizza: "bg-orange-100 text-orange-600",
  beef: "bg-red-100 text-red-600",
  utensils: "bg-blue-100 text-blue-600",
  sandwich: "bg-yellow-100 text-yellow-600",
  "ice-cream": "bg-pink-100 text-pink-600",
  croissant: "bg-amber-100 text-amber-600",
  grape: "bg-purple-100 text-purple-600",
  fish: "bg-cyan-100 text-cyan-600",
  package: "bg-green-100 text-green-600",
  "cup-soda": "bg-emerald-100 text-emerald-600",
};

interface CategoriesCarouselProps {
  onCategoryClick?: (categoryId: string) => void;
}

const CategoriesCarousel = ({ onCategoryClick }: CategoriesCarouselProps) => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const { segments, loading } = useSegments();

  if (loading) {
    return (
      <section className="py-8 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">O que você está buscando?</h2>
          <div className="flex gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl bg-muted animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (segments.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold mb-6">O que você está buscando?</h2>
        
        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={scrollRef}
            {...handlers}
            className={`flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {segments.map((segment) => {
              const IconComponent = segment.icon ? iconMap[segment.icon] || Store : Store;
              const colorClass = segment.icon ? colorMap[segment.icon] || "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-600";
              
              return (
                <button
                  key={segment.id}
                  onClick={() => onCategoryClick?.(segment.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group/item"
                >
                  <div 
                    className={`w-20 h-20 rounded-2xl ${colorClass} flex items-center justify-center transition-transform group-hover/item:scale-105 shadow-soft`}
                  >
                    <IconComponent className="w-10 h-10" />
                  </div>
                  <span className="text-sm font-medium text-center">{segment.name}</span>
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card"
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
