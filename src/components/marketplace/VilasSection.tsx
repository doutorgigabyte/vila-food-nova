import { Link, useNavigate } from "react-router-dom";
import { MapPin, Store, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVilas, Vila } from "@/hooks/useVilas";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDragScroll } from "@/hooks/useDragScroll";

interface VilaWithCount extends Vila {
  establishmentCount: number;
}

const VilasSection = () => {
  const { vilas, loading } = useVilas();
  const [vilasWithCount, setVilasWithCount] = useState<VilaWithCount[]>([]);
  const { scrollRef, isDragging, wasClick, handlers, scroll } = useDragScroll();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      if (vilas.length === 0) return;

      const vilasData: VilaWithCount[] = await Promise.all(
        vilas.map(async (vila) => {
          const { count } = await supabase
            .from('establishments')
            .select('*', { count: 'exact', head: true })
            .eq('vila_id', vila.id)
            .eq('status', 'active');

          return {
            ...vila,
            establishmentCount: count || 0,
          };
        })
      );

      setVilasWithCount(vilasData.filter(v => v.establishmentCount > 0));
    };

    fetchCounts();
  }, [vilas]);

  if (loading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-72 h-44 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (vilasWithCount.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg hidden md:flex">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                Vilas Gastronômicas
                <MapPin className="w-4 h-4 text-primary md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Explore os melhores polos de alimentação
              </p>
            </div>
          </div>
          <Link 
            to="/vilas" 
            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Horizontal scroll container */}
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
            className={`flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {vilasWithCount.map((vila) => (
              <div 
                key={vila.id} 
                className="flex-shrink-0 cursor-pointer"
                onClick={() => {
                  if (wasClick()) {
                    navigate(`/vila/${vila.slug}`);
                  }
                }}
              >
                <Card className="w-72 md:w-80 overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                  <div className="relative h-28 md:h-32 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                    {vila.image_url ? (
                      <img
                        src={vila.image_url}
                        alt={vila.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-white text-lg">{vila.name}</h3>
                    </div>
                  </div>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">{vila.establishmentCount} estabelecimentos</span>
                      </div>
                      {vila.neighborhood && (
                        <Badge variant="secondary" className="text-xs">
                          {vila.neighborhood}
                        </Badge>
                      )}
                    </div>
                    {vila.description && (
                      <p className="text-xs md:text-sm text-muted-foreground mt-2 line-clamp-2">
                        {vila.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
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

export default VilasSection;
