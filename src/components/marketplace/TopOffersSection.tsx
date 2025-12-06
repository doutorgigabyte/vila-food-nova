import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductsByMainCategory } from "@/hooks/useProducts";
import ProductOfferCard from "./ProductOfferCard";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { Link } from "react-router-dom";
import { useDragScroll } from "@/hooks/useDragScroll";

interface TopOffersSectionProps {
  mainCategory?: string | null;
}

const TopOffersSection = ({ mainCategory }: TopOffersSectionProps) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const { products, loading } = useProductsByMainCategory(mainCategory || null, 30);
  const theme = getCategoryTheme(mainCategory || null);

  // Use drag scroll hook for mouse + touch drag support
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll({
    direction: "horizontal",
    momentum: true,
    friction: 0.92,
    sensitivity: 1,
  });

  // Filter products with promotional price
  const offersProducts = products.filter(
    (p) => p.promotional_price && p.promotional_price < p.price
  );

  // Track scroll position for snap behavior
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [offersProducts.length, scrollRef]);

  if (loading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-52 h-56 rounded-3xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (offersProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg hidden md:flex",
              mainCategory ? `bg-${mainCategory === 'comida' ? 'amber' : mainCategory === 'mercado' ? 'emerald' : mainCategory === 'farmacia' ? 'red' : 'primary'}-100 dark:bg-${mainCategory}-900/30` : "bg-destructive/10"
            )}>
              <Percent className={cn("w-5 h-5", theme.accentColor || "text-destructive")} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                {theme.offersTitle}
                <Percent className={cn("w-4 h-4 md:hidden", theme.accentColor || "text-destructive")} />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                {theme.offersSubtitle}
              </p>
            </div>
          </div>
          <Link 
            to={`/produtos/ofertas${mainCategory ? `?categoria=${mainCategory}` : ''}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>

        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md transition-opacity bg-card hidden md:flex",
              canScrollLeft ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => scroll("left", 320)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* iOS-style scroll with drag support */}
          <div
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 overscroll-x-contain select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {offersProducts.map((product) => (
              <div 
                key={product.id} 
                className="flex-shrink-0 snap-center"
                style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
              >
                <ProductOfferCard product={product} variant="large" />
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md transition-opacity bg-card hidden md:flex",
              canScrollRight ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => scroll("right", 320)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TopOffersSection;
