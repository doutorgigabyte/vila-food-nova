import { useState, useMemo, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Loader2 } from "lucide-react";
import { Establishment } from "@/hooks/useEstablishment";
import EstablishmentCard from "./EstablishmentCard";
import RestaurantFilters from "./RestaurantFilters";
import { useCategoryTitle } from "@/hooks/useEstablishmentsByCategory";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface AllRestaurantsProps {
  establishments: Establishment[];
  loading?: boolean;
  mainCategory?: string | null;
  subcategory?: string | null;
}

const AllRestaurants = memo(({ establishments, loading, mainCategory, subcategory }: AllRestaurantsProps) => {
  // All hooks must be called before any early returns
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const titles = useCategoryTitle(mainCategory || null);
  const theme = getCategoryTheme(mainCategory || null);

  // Filter and sort establishments - memoized for performance
  const filteredEstablishments = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let filtered = establishments.filter((est) => {
      switch (activeFilter) {
        case "new":
          if (est.created_at) {
            return new Date(est.created_at) >= thirtyDaysAgo;
          }
          return false;
        case "popular":
          return est.is_open === true;
        case "top_rated":
          return true;
        default:
          return true;
      }
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          const aRating = a.rating_average || 0;
          const bRating = b.rating_average || 0;
          if (bRating !== aRating) return bRating - aRating;
          return (b.rating_count || 0) - (a.rating_count || 0);
        case "delivery_time":
          return (a.avg_delivery_time || 999) - (b.avg_delivery_time || 999);
        case "distance":
          return (a.min_order_value || 999) - (b.min_order_value || 999);
        default:
          const aScore = a.is_open ? 0 : 1;
          const bScore = b.is_open ? 0 : 1;
          if (aScore !== bScore) return aScore - bScore;
          const aR = a.rating_average || 0;
          const bR = b.rating_average || 0;
          if (bR !== aR) return bR - aR;
          return (a.name || '').localeCompare(b.name || '');
      }
    });
  }, [establishments, activeFilter, sortBy]);

  // Infinite scroll with initial 12 items, load 8 more each time
  const { 
    displayedItems, 
    hasMore, 
    isLoading: loadingMore, 
    observerRef 
  } = useInfiniteScroll(filteredEstablishments, {
    initialPageSize: 12,
    pageSize: 8
  });

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-40 bg-muted" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (establishments.length === 0) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            {titles.stores}
          </h2>
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">{theme.icon}</span>
            </div>
            <h3 className="font-semibold mb-2">Nenhum estabelecimento encontrado</h3>
            <p className="text-muted-foreground">
              Não há estabelecimentos disponíveis {mainCategory ? 'nesta categoria' : 'no momento'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn(
      "py-8",
      mainCategory && `bg-gradient-to-b ${theme.bgGradient}`
    )}>
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Store className={cn("w-5 h-5", theme.iconColor || "text-primary")} />
          {titles.stores}
        </h2>
        
        <RestaurantFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          totalCount={filteredEstablishments.length}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedItems.map((est) => (
            <EstablishmentCard key={est.id} establishment={est} />
          ))}
        </div>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={observerRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando mais...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
});

AllRestaurants.displayName = "AllRestaurants";

export default AllRestaurants;
