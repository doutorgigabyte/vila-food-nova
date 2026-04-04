import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store } from "lucide-react";
import { Establishment } from "@/hooks/useEstablishment";
import EstablishmentCard from "./EstablishmentCard";
import RestaurantFilters from "./RestaurantFilters";
import { useCategoryTitle } from "@/hooks/useEstablishmentsByCategory";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { cn } from "@/lib/utils";

interface AllRestaurantsProps {
  establishments: Establishment[];
  loading?: boolean;
  mainCategory?: string | null;
  subcategory?: string | null;
}

const AllRestaurants = ({ establishments, loading, mainCategory, subcategory }: AllRestaurantsProps) => {
  // All hooks must be called before any early returns
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const titles = useCategoryTitle(mainCategory || null);
  const theme = getCategoryTheme(mainCategory || null);

  // Filter and sort establishments - memoized for performance
  // MUST be called before any early returns to maintain hook order
  const filteredEstablishments = useMemo(() => {
    let filtered = establishments.filter((est: any) => {
      switch (activeFilter) {
        case "new": {
          // Recém-chegados - establishments created in last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return est.created_at ? new Date(est.created_at) >= thirtyDaysAgo : false;
        }
        case "popular":
          // Popular - establishments that are currently open
          return est.is_open === true;
        case "top_rated":
          // Melhor avaliados - featured / with lowest delivery times
          return (est.avg_delivery_time || 999) <= 45;
        default:
          return true;
      }
    });

    // Sort establishments
    return [...filtered].sort((a: any, b: any) => {
      switch (sortBy) {
        case "rating":
          // Sort by open status first, then by name
          return (b.is_open ? 1 : 0) - (a.is_open ? 1 : 0) || a.name.localeCompare(b.name);
        case "delivery_time":
          return (a.avg_delivery_time || 999) - (b.avg_delivery_time || 999);
        case "distance":
          // Sort by neighborhood alphabetically as proxy for distance
          return (a.neighborhood || "").localeCompare(b.neighborhood || "");
        default:
          // Recommended - open first, then by delivery time
          return (b.is_open ? 1 : 0) - (a.is_open ? 1 : 0)
            || (a.avg_delivery_time || 999) - (b.avg_delivery_time || 999);
      }
    });
  }, [establishments, activeFilter, sortBy]);

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
          {filteredEstablishments.map((est) => (
            <EstablishmentCard key={est.id} establishment={est} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AllRestaurants;
