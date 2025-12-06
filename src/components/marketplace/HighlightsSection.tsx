import { Link } from "react-router-dom";
import { Star, Heart, Clock, MapPin, Sparkles, ChevronRight, ChevronLeft, Bike } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstablishments } from "@/hooks/useEstablishment";
import { useDragScroll } from "@/hooks/useDragScroll";

const HighlightsSection = () => {
  const { establishments, loading } = useEstablishments();
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  
  // Pegar os primeiros 6 estabelecimentos como destaques
  const highlights = establishments.slice(0, 6);

  if (loading) {
    return (
      <section className="py-6 md:py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg hidden md:flex">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-4 w-64 hidden md:block" />
              </div>
            </div>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="flex-shrink-0 w-[280px] md:w-[320px] overflow-hidden animate-pulse">
                <div className="h-40 md:h-48 bg-muted" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
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
    <section className="py-6 md:py-8 bg-card">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg hidden md:flex">
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
            to="/marketplace/destaques" 
            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Horizontal scroll container */}
        <div className="relative group">
          {/* Desktop scroll buttons */}
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
            {highlights.map((est) => (
              <Link 
                key={est.id} 
                to={`/loja/${est.slug}`}
                className="flex-shrink-0 snap-start"
              >
                {/* Mobile Card - Compact */}
                <Card className="w-[280px] md:hidden overflow-hidden group/card hover:shadow-lg transition-all">
                  <div className="relative h-36 overflow-hidden">
                    {est.banner_url ? (
                      <img
                        src={est.banner_url}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('bg-gradient-to-br', 'from-primary/20', 'to-primary/5');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-4xl opacity-50">🍽️</span>
                      </div>
                    )}
                    
                    {est.is_open ? (
                      <Badge className="absolute top-2 left-2 bg-green-500 text-xs">Aberto</Badge>
                    ) : (
                      <Badge variant="secondary" className="absolute top-2 left-2 text-xs">Fechado</Badge>
                    )}
                    
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>4.5</span>
                    </div>
                  </div>
                  
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      {est.logo_url && (
                        <img
                          src={est.logo_url}
                          alt={est.name}
                          className="w-8 h-8 rounded-full object-cover border border-border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{est.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {est.avg_delivery_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {est.avg_delivery_time}min
                            </span>
                          )}
                          {est.neighborhood && (
                            <span className="truncate">{est.neighborhood}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Desktop Card - More complete */}
                <Card className="hidden md:block w-[320px] overflow-hidden group/card hover:shadow-elevated transition-all h-full">
                  <div className="relative h-48 overflow-hidden">
                    {est.banner_url ? (
                      <img
                        src={est.banner_url}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('bg-gradient-to-br', 'from-primary/20', 'to-primary/5');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-6xl opacity-50">🍽️</span>
                      </div>
                    )}
                    
                    {est.is_open ? (
                      <Badge className="absolute top-3 left-3 bg-green-500">Aberto agora</Badge>
                    ) : (
                      <Badge variant="secondary" className="absolute top-3 left-3">Fechado</Badge>
                    )}
                    
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>4.5</span>
                      <span className="text-muted-foreground">(0)</span>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-card"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {est.logo_url ? (
                        <img
                          src={est.logo_url}
                          alt={est.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xl">🏪</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{est.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {est.description || 'Deliciosas opções esperando por você'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Info tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      {est.neighborhood && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          <MapPin className="w-3 h-3" />
                          {est.neighborhood}
                        </span>
                      )}
                      {est.avg_delivery_time && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          {est.avg_delivery_time}-{est.avg_delivery_time + 15}min
                        </span>
                      )}
                      {est.accepts_delivery && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          <Bike className="w-3 h-3" />
                          Delivery
                        </span>
                      )}
                    </div>

                    {/* Min order value */}
                    {est.min_order_value && est.min_order_value > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Pedido mínimo: <span className="font-medium text-foreground">R$ {est.min_order_value.toFixed(2)}</span>
                      </p>
                    )}
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
