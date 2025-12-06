import { ChevronLeft, ChevronRight, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useProducts } from "@/hooks/useProducts";
import ProductOfferCard from "./ProductOfferCard";

const TopOffersSection = () => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const { products, loading } = useProducts(20);

  // Filter products with promotional price
  const offersProducts = products.filter(
    (p) => p.promotional_price && p.promotional_price < p.price
  );

  if (loading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-52 h-56 rounded-xl" />
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
            <div className="p-2 bg-destructive/10 rounded-lg hidden md:flex">
              <Percent className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                Ofertas Imperdíveis
                <Percent className="w-4 h-4 text-destructive md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Produtos com desconto especial para você
              </p>
            </div>
          </div>
        </div>

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
            className={cn(
              "flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 select-none",
              "touch-pan-y will-change-scroll overscroll-x-contain",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: isDragging ? 'none' : 'x proximity',
            }}
          >
            {offersProducts.map((product) => (
              <div key={product.id} className="flex-shrink-0 scroll-card">
                <ProductOfferCard product={product} variant="large" />
              </div>
            ))}
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

export default TopOffersSection;
