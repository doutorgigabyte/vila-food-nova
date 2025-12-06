import { ChevronLeft, ChevronRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useEstablishments } from "@/hooks/useEstablishment";
import { cn } from "@/lib/utils";
import EstablishmentCard from "./EstablishmentCard";
import { Link } from "react-router-dom";

const BestStoresSection = () => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const { establishments, loading } = useEstablishments();

  // Get best stores (could be filtered by rating in the future)
  const bestStores = establishments.slice(0, 8);

  if (loading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-80 h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (bestStores.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg hidden md:flex">
              <Award className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                Melhores Lojas Próximas
                <Award className="w-4 h-4 text-accent md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Os estabelecimentos mais bem avaliados perto de você
              </p>
            </div>
          </div>
          <Link 
            to="/estabelecimentos" 
            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
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
              "flex gap-4 overflow-x-auto scrollbar-hide pb-2 select-none",
              "touch-pan-y will-change-scroll overscroll-x-contain",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: isDragging ? 'none' : 'x proximity',
            }}
          >
            {bestStores.map((establishment) => (
              <div 
                key={establishment.id} 
                className="flex-shrink-0 w-72 md:w-80 scroll-card"
                onClick={(e) => isDragging && e.preventDefault()}
              >
                <EstablishmentCard 
                  establishment={establishment} 
                  variant="featured" 
                  showVisitButton 
                />
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

export default BestStoresSection;
