import { ChevronLeft, ChevronRight, MapPin, Star, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useEstablishments } from "@/hooks/useEstablishment";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { getCategoryTheme } from "@/lib/categoryThemes";

interface NearbyStoresSectionProps {
  mainCategory?: string | null;
  subcategory?: string | null;
}

const NearbyStoresSection = ({ mainCategory, subcategory }: NearbyStoresSectionProps) => {
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const { establishments, loading } = useEstablishments();
  const theme = getCategoryTheme(mainCategory || null);

  // Filter by category if selected
  const filteredEstablishments = mainCategory 
    ? establishments.filter((e) => {
        // Se subcategoria selecionada, filtrar por segment_id
        if (subcategory) {
          return e.segment_id === subcategory;
        }
        return true;
      }).slice(0, 10)
    : establishments.slice(0, 10);

  if (loading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-72 h-56 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (filteredEstablishments.length === 0) {
    return null;
  }

  return (
    <section className={cn(
      "py-6 md:py-8",
      mainCategory ? `bg-gradient-to-b ${theme.bgGradient}` : "bg-background"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl hidden md:flex",
              theme.iconBg || "bg-blue-100 dark:bg-blue-900/30"
            )}>
              <MapPin className={cn("w-5 h-5", theme.iconColor || "text-blue-600")} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                Perto de Você
                <MapPin className={cn("w-4 h-4 md:hidden", theme.iconColor || "text-blue-500")} />
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                Lojas próximas com entrega rápida
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
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {filteredEstablishments.map((est, index) => (
              <Link 
                key={est.id} 
                to={`/loja/${est.slug}`}
                className="flex-shrink-0 snap-start"
                onClick={(e) => isDragging && e.preventDefault()}
              >
                <Card className="w-64 md:w-72 overflow-hidden group/card hover:shadow-elevated transition-all duration-300 border-0 shadow-soft">
                  <div className="relative h-32 md:h-36 bg-muted overflow-hidden">
                    {est.banner_url ? (
                      <img
                        src={est.banner_url}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                        draggable={false}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-5xl opacity-50">🏪</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    
                    {est.is_open ? (
                      <Badge className="absolute top-3 left-3 bg-green-500 text-white text-xs shadow-md">
                        Aberto
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="absolute top-3 left-3 text-xs shadow-md">
                        Fechado
                      </Badge>
                    )}

                    {/* Distância simulada */}
                    <Badge variant="outline" className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-xs shadow-md gap-1">
                      <MapPin className="w-3 h-3" />
                      {(Math.random() * 3 + 0.5).toFixed(1)} km
                    </Badge>

                    {/* Logo */}
                    <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl border-2 border-card bg-card shadow-lg overflow-hidden">
                      {est.logo_url ? (
                        <img src={est.logo_url} alt={est.name} className="w-full h-full object-cover" draggable={false} />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg">🏪</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="pt-7 pb-4 px-4">
                    <h3 className="font-bold text-base truncate">{est.name}</h3>
                    
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.{Math.floor(Math.random() * 5) + 5}</span>
                      </div>
                      {est.avg_delivery_time && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{est.avg_delivery_time} min</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {est.accepts_delivery && (
                        <Badge variant="outline" className="text-xs gap-1 bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400">
                          <Truck className="w-3 h-3" />
                          Entrega Grátis
                        </Badge>
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

export default NearbyStoresSection;
