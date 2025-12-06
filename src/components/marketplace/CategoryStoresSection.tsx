import { useState } from "react";
import { Store, Star, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_open: boolean;
  avg_delivery_time: number | null;
}

interface CategoryStoresSectionProps {
  establishments: Establishment[];
  categoryName: string;
  loading: boolean;
}

const CategoryStoresSection = ({ establishments, categoryName, loading }: CategoryStoresSectionProps) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("todos");

  if (loading) {
    return (
      <div className="py-6 px-4">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (establishments.length === 0) {
    return (
      <div className="py-12 px-4 text-center">
        <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma loja encontrada</h3>
        <p className="text-muted-foreground">
          Não encontramos lojas para {categoryName} no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-lg font-semibold">Lojas de {categoryName}</h2>
        <span className="text-sm text-muted-foreground">{establishments.length} lojas</span>
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-4">
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="novos" className="text-xs">Novos</TabsTrigger>
            <TabsTrigger value="populares" className="text-xs">Populares</TabsTrigger>
            <TabsTrigger value="avaliados" className="text-xs">Bem Avaliados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Store grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
        {establishments.map((establishment) => (
          <button
            key={establishment.id}
            onClick={() => navigate(`/loja/${establishment.slug}`)}
            className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-200 text-left group"
          >
            {/* Logo */}
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {establishment.logo_url ? (
                <img
                  src={establishment.logo_url}
                  alt={establishment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {establishment.name}
              </h3>
              {establishment.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {establishment.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className={`flex items-center gap-1 ${establishment.is_open ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${establishment.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                  {establishment.is_open ? 'Aberto' : 'Fechado'}
                </span>
                {establishment.avg_delivery_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {establishment.avg_delivery_time} min
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  4.5
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryStoresSection;
