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
  totalCount 
}: RestaurantFiltersProps) => {
  const [sortBy, setSortBy] = useState("recommended");

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
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Ordenar
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={cn(
                  "cursor-pointer",
                  sortBy === option.id && "bg-accent"
                )}
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
