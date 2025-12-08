import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface RestaurantFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  totalCount?: number;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

const filters = [
  { id: "all", label: "Todos" },
  { id: "new", label: "Recém-chegados" },
  { id: "popular", label: "Popular" },
  { id: "top_rated", label: "Melhor Avaliados" },
];

const sortOptions = [
  { id: "recommended", label: "Recomendados" },
  { id: "rating", label: "Avaliação" },
  { id: "delivery_time", label: "Tempo de entrega" },
  { id: "distance", label: "Distância" },
];

const RestaurantFilters = ({ 
  activeFilter, 
  onFilterChange, 
  totalCount,
  sortBy: externalSortBy,
  onSortChange
}: RestaurantFiltersProps) => {
  const [internalSortBy, setInternalSortBy] = useState("recommended");
  const sortBy = externalSortBy || internalSortBy;
  
  const handleSortChange = (newSort: string) => {
    if (onSortChange) {
      onSortChange(newSort);
    } else {
      setInternalSortBy(newSort);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "flex-shrink-0 transition-all",
              activeFilter === filter.id && "shadow-md"
            )}
            aria-label={`Filtrar por ${filter.label}`}
            aria-pressed={activeFilter === filter.id}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Sort and count */}
      <div className="flex items-center gap-3">
        {totalCount !== undefined && (
          <Badge variant="secondary" className="hidden md:flex">
            {totalCount} estabelecimentos
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" aria-label="Ordenar estabelecimentos" aria-haspopup="true">
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              Ordenar
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" role="menu">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => handleSortChange(option.id)}
                className={cn(
                  "cursor-pointer",
                  sortBy === option.id && "bg-accent"
                )}
                role="menuitem"
                aria-checked={sortBy === option.id}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default RestaurantFilters;
