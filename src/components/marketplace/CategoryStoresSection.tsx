import { useState } from "react";
import { Store, Star, Clock, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url?: string | null;
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

  const filters = [
    { id: "todos", label: "Todos" },
    { id: "novos", label: "Novos" },
    { id: "populares", label: "Populares" },
    { id: "avaliados", label: "Bem Avaliados" },
  ];

  if (loading) {
    return (
      <div className="py-6 px-4">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
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
    <div className="py-6 bg-card">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-lg font-semibold">Lojas de {categoryName}</h2>
        <span className="text-sm text-muted-foreground">{establishments.length} lojas</span>
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${filter === f.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Store grid - card style like 6amMart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
        {establishments.map((establishment) => (
          <button
            key={establishment.id}
            onClick={() => navigate(`/loja/${establishment.slug}`)}
            className="bg-background rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200 text-left group"
          >
            {/* Banner/Image area */}
            <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5">
              {establishment.banner_url ? (
                <img
                  src={establishment.banner_url}
                  alt={establishment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
              
              {/* Favorite button */}
              <button 
                className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle favorite
                }}
              >
                <Heart className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Logo overlay */}
              <div className="absolute -bottom-6 left-4">
                <div className="w-14 h-14 rounded-xl bg-background border-2 border-background shadow-md flex items-center justify-center overflow-hidden">
                  {establishment.logo_url ? (
                    <img
                      src={establishment.logo_url}
                      alt={establishment.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 pt-8">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {establishment.name}
              </h3>
              
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  4.5 (0)
                </span>
                <span className={`flex items-center gap-1 ${establishment.is_open ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${establishment.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                  {establishment.is_open ? 'Aberto' : 'Fechado'}
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
