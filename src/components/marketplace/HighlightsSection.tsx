import { Link } from "react-router-dom";
import { Star, Clock, MapPin, Heart, ChevronRight, ChevronLeft, Sparkles, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstablishments } from "@/hooks/useEstablishment";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";

const HighlightsSection = () => {
  const { establishments, loading } = useEstablishments();
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();

  const highlights = establishments.slice(0, 6);

  if (loading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-72 h-52 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (highlights.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl hidden md:flex">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                Destaques para você
                <Sparkles className="w-4 h-4 text-primary md:hidden" />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Veja nossos restaurantes e pratos mais populares
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
              "flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 snap-x snap-mandatory md:snap-none select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {highlights.map((est, index) => (
              <Link 
                key={est.id} 
                to={`/loja/${est.slug}`}
                className="flex-shrink-0 snap-start"
                onClick={(e) => isDragging && e.preventDefault()}
              >
                <Card className="w-64 md:w-72 overflow-hidden group/card hover:shadow-elevated transition-all duration-300 border-0 shadow-soft">
                  <div className="relative h-36 md:h-40 bg-muted overflow-hidden">
                    {est.banner_url ? (
                      <img
                        src={est.banner_url}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-5xl opacity-50">🍴</span>
                      </div>
                    )}
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Status Badge */}
                    {est.is_open ? (
                      <Badge className="absolute top-3 left-3 bg-green-500 text-white text-xs shadow-md">
                        Aberto
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="absolute top-3 left-3 text-xs shadow-md">
                        Fechado
                      </Badge>
                    )}

                    {/* New badge for first 2 items */}
                    {index < 2 && (
                      <Badge className="absolute top-3 left-20 bg-accent text-accent-foreground text-xs font-bold shadow-md">
                        NOVO
                      </Badge>
                    )}
                    
                    {/* Favorite button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-3 right-3 w-8 h-8 bg-card/80 backdrop-blur-sm hover:bg-card text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>

                    {/* Logo */}
                    <div className="absolute -bottom-5 left-4 w-14 h-14 rounded-xl border-2 border-card bg-card shadow-lg overflow-hidden">
                      {est.logo_url ? (
                        <img src={est.logo_url} alt={est.name} className="w-full h-full object-cover" draggable={false} />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xl">🏪</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="pt-8 pb-4 px-4">
                    <h3 className="font-bold text-base truncate">{est.name}</h3>
                    
                    {est.description && (
                      <p className="text-xs text-muted-foreground truncate mt-1">{est.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.5</span>
                      </div>
                      {est.avg_delivery_time && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{est.avg_delivery_time} min</span>
                        </div>
                      )}
                      {est.neighborhood && (
                        <div className="flex items-center gap-1 text-muted-foreground text-xs ml-auto truncate max-w-[100px]">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{est.neighborhood}</span>
                        </div>
                      )}
                    </div>

                    {/* Delivery info */}
                    <div className="flex items-center gap-2 mt-3">
                      {est.accepts_delivery && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Truck className="w-3 h-3" />
                          Delivery
                        </Badge>
                      )}
                      {est.accepts_pickup && (
                        <Badge variant="outline" className="text-xs">Retirada</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
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

export default HighlightsSection;
