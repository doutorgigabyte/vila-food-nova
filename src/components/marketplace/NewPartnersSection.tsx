import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useEstablishments } from "@/hooks/useEstablishment";
import EstablishmentCard from "./EstablishmentCard";

const NewPartnersSection = () => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const { establishments, loading } = useEstablishments();

  // Get newest establishments (could be sorted by created_at in the future)
  const newPartners = establishments.slice(0, 6);

  if (loading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-56 h-52 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (newPartners.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg hidden md:flex">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                Novos no VilaFood
                <Sparkles className="w-4 h-4 text-primary md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Conheça os novos parceiros da nossa plataforma
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
            className={`flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 snap-x snap-mandatory md:snap-none select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {newPartners.map((establishment) => (
              <div 
                key={establishment.id} 
                className="flex-shrink-0 snap-start w-52 md:w-60"
                onClick={(e) => isDragging && e.preventDefault()}
              >
                <EstablishmentCard 
                  establishment={establishment} 
                  variant="compact" 
                  isNew 
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

export default NewPartnersSection;
