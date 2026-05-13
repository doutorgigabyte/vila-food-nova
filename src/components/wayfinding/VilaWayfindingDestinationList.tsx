import { useMemo, useState } from "react";
import { Search, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { VilaEstablishment } from "@/hooks/useVilas";

interface VilaWayfindingDestinationListProps {
  establishments: VilaEstablishment[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

export const VilaWayfindingDestinationList = ({
  establishments,
  selectedId,
  onSelect,
}: VilaWayfindingDestinationListProps) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return establishments;
    return establishments.filter((e) => e.name.toLowerCase().includes(q));
  }, [establishments, query]);

  const available = filtered.filter(
    (e) => typeof e.latitude === "number" && typeof e.longitude === "number"
  );
  const missingCoords = establishments.length - available.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar estabelecimento..."
          className="pl-9"
          aria-label="Buscar estabelecimento na vila"
        />
      </div>

      {missingCoords > 0 && (
        <p className="text-xs text-muted-foreground">
          {missingCoords} estabelecimento{missingCoords > 1 ? "s" : ""} sem localizacao cadastrada.
        </p>
      )}

      <ul className="flex flex-col gap-2 max-h-[42vh] overflow-y-auto pr-1" role="listbox" aria-label="Estabelecimentos disponiveis">
        {available.length === 0 && (
          <li className="text-sm text-muted-foreground py-4 text-center">
            Nenhum estabelecimento encontrado.
          </li>
        )}
        {available.map((est) => {
          const isSelected = est.id === selectedId;
          return (
            <li key={est.id} role="option" aria-selected={isSelected}>
              <button
                type="button"
                onClick={() => onSelect(est.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:bg-accent/40"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {est.logo_url ? (
                    <img src={est.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{est.name}</p>
                  {est.address && (
                    <p className="text-xs text-muted-foreground truncate">{est.address}</p>
                  )}
                </div>
                {isSelected && <Navigation className="w-4 h-4 text-primary" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
