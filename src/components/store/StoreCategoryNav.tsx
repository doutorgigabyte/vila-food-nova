import { useRef } from "react";
import { ChevronLeft, ChevronRight, Flame, Star, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const allTabs = [
    { id: null, name: "TODAS", icon: Grid3X3, count: null },
    ...(hasPromotions ? [{ id: "promocoes", name: "PROMOÇÕES", icon: Flame, count: promoCount }] : []),
    ...(hasFeatured ? [{ id: "destaques", name: "DESTAQUES", icon: Star, count: featuredCount }] : []),
    ...categories.map((cat) => ({ id: cat.id, name: cat.name.toUpperCase(), icon: null, count: cat.count })),
  ];

  return (
    <div className="relative mx-4 my-4">
      {/* Desktop Navigation Arrows */}
      <button
        onClick={() => scroll("left")}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 bg-card shadow-md rounded-full items-center justify-center z-10 hover:bg-muted transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 bg-card shadow-md rounded-full items-center justify-center z-10 hover:bg-muted transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Categories */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {allTabs.map((tab) => {
          const isActive = selectedCategory === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id || "all"}
              onClick={() => onSelectCategory(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all shrink-0",
                "border min-w-[80px] scroll-snap-align-start",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lg"
                  : "bg-card hover:bg-muted border-border"
              )}
              style={{ scrollSnapAlign: "start" }}
            >
              {IconComponent && <IconComponent className="w-5 h-5" />}
              <span className="text-[10px] font-semibold whitespace-nowrap">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
