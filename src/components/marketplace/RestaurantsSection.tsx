import { Link } from "react-router-dom";
import { Star, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstablishmentsByCategory } from "@/hooks/useEstablishmentsByCategory";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";
import { getCategoryTheme } from "@/lib/categoryThemes";

interface RestaurantsSectionProps {
  title?: string;
  mainCategory?: string | null;
  subcategory?: string | null;
}

const RestaurantsSection = ({ 
  title,
  mainCategory,
  subcategory
}: RestaurantsSectionProps) => {
  const { establishments, loading } = useEstablishmentsByCategory(mainCategory || null, subcategory, 10);
  const { scrollRef, isDragging, handlers, scroll } = useDragScroll();
  const theme = getCategoryTheme(mainCategory || null);
  
  // Filter establishments that accept table service
  const restaurants = establishments.filter(est => est.accepts_table).slice(0, 5);

  // Dynamic title based on category
  const sectionTitle = title || (mainCategory === 'comida' ? 'Quer Comer no Local?' : 'Aceita Retirada no Local');

  if (loading) {
    return (
      <section className="py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex items-center gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 h-20 w-[280px] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (restaurants.length === 0) {
    return null;
  }

  return (
    <section className={cn(
      "py-8 bg-card",
      mainCategory && `bg-gradient-to-b ${theme.bgGradient}`
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center",
              theme.iconBg || "bg-primary/10"
            )}>
              <span className="text-4xl">{theme.icon}</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{sectionTitle}</h2>
          </div>
        </div>

        {/* Scrollable container with drag support and hidden scrollbar */}
        <div className="relative group">
          {/* Left Arrow */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-card opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={scrollRef}
            {...handlers}
            className={cn(
              "flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide select-none drag-scroll-container",
              "scroll-smooth snap-x snap-mandatory",
              isDragging && "cursor-grabbing"
            )}
            style={{
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {restaurants.map((restaurant) => (
              <Link 
                key={restaurant.id}
                to={`/loja/${restaurant.slug}`}
                onClick={(e) => isDragging && e.preventDefault()}
                className={cn(
                  "flex-shrink-0 flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-all min-w-[280px] snap-start",
                  "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {restaurant.logo_url ? (
                  <img
                    src={restaurant.logo_url}
                    alt={restaurant.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-background"
                    draggable={false}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                    <span className="text-lg">🏪</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{restaurant.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {restaurant.neighborhood || restaurant.address || 'Tamandaré'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">4.5</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      📍 {restaurant.avg_delivery_time || 30} min
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            
            <Link to={mainCategory ? `/categoria/${mainCategory}?view=restaurants` : "/marketplace?view=restaurants"}>
              <Button variant="ghost" className="flex-shrink-0 gap-1 text-primary">
                Ver Todos
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Right Arrow */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-card opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RestaurantsSection;
