import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Establishment } from "@/hooks/useEstablishment";
import EstablishmentCard from "./EstablishmentCard";
import RestaurantFilters from "./RestaurantFilters";

interface AllRestaurantsProps {
  establishments: Establishment[];
  loading?: boolean;
}

const AllRestaurants = ({ establishments, loading }: AllRestaurantsProps) => {
  const [activeFilter, setActiveFilter] = useState("all");

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
          <h2 className="text-xl font-bold mb-6">Todos os Restaurantes</h2>
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <h3 className="font-semibold mb-2">Nenhum restaurante encontrado</h3>
            <p className="text-muted-foreground">
              Não há restaurantes disponíveis no momento
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Filter establishments based on active filter
  const filteredEstablishments = establishments.filter((est) => {
    switch (activeFilter) {
      case "new":
        // Could filter by created_at in the future
        return true;
      case "popular":
        // Could filter by order count in the future
        return true;
      case "top_rated":
        // Could filter by rating in the future
        return true;
      default:
        return true;
    }
  });

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold mb-4">Todos os Restaurantes</h2>
        
        <RestaurantFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          totalCount={filteredEstablishments.length}
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
