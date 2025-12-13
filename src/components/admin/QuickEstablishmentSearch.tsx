import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Store, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: string | null;
}

const QuickEstablishmentSearch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 3) {
      setResults([]);
      setShowDropdown(query.length > 0);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("establishments")
          .select("id, name, slug, logo_url, status")
          .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
          .order("name")
          .limit(8);

        if (error) throw error;
        setResults(data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Erro ao buscar estabelecimentos:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = async (establishment: Establishment) => {
    // Log admin access
    if (user?.id) {
      try {
        await supabase.from("admin_access_logs").insert({
          admin_user_id: user.id,
          establishment_id: establishment.id,
          action: "quick_search_access",
          metadata: { source: "quick_search", query }
        });
      } catch (error) {
        console.error("Erro ao registrar acesso:", error);
      }
    }

    setQuery("");
    setShowDropdown(false);
    navigate(`/painel/${establishment.slug}`);
  };

  const highlightMatch = (text: string) => {
    if (query.length < 3) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-primary/20 text-primary font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar loja..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setShowDropdown(true)}
          className="pl-8 h-9 text-sm bg-muted/50"
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {query.length < 3 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Digite 3+ letras para buscar
            </div>
          ) : isLoading ? (
            <div className="p-3 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Nenhum resultado encontrado
            </div>
          ) : (
            <div className="py-1">
              {results.map((establishment) => (
                <button
                  key={establishment.id}
                  onClick={() => handleSelect(establishment)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {establishment.logo_url ? (
                      <img
                        src={establishment.logo_url}
                        alt={establishment.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {highlightMatch(establishment.name)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {highlightMatch(establishment.slug)}
                    </p>
                  </div>
                  <Badge
                    variant={establishment.status === "active" ? "default" : "secondary"}
                    className="text-xs shrink-0"
                  >
                    {establishment.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickEstablishmentSearch;
