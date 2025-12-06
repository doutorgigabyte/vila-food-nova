import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowUpRight, Store, Package, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  type: "product" | "establishment" | "category";
  name: string;
  description?: string;
  image_url?: string;
  slug?: string;
  establishment_slug?: string;
}

interface SmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartSearch = ({ isOpen, onClose }: SmartSearchProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vilafood_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        performSearch(searchTerm);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search products
      const { data: products } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image_url,
          establishments:establishment_id (slug)
        `)
        .eq("is_active", true)
        .ilike("name", `%${query}%`)
        .limit(5);

      if (products) {
        products.forEach((p: any) => {
          searchResults.push({
            id: p.id,
            type: "product",
            name: p.name,
            description: p.description,
            image_url: p.image_url,
            establishment_slug: p.establishments?.slug,
          });
        });
      }

      // Search establishments
      const { data: establishments } = await supabase
        .from("establishments")
        .select("id, name, description, logo_url, slug")
        .eq("status", "active")
        .ilike("name", `%${query}%`)
        .limit(5);

      if (establishments) {
        establishments.forEach((e) => {
          searchResults.push({
            id: e.id,
            type: "establishment",
            name: e.name,
            description: e.description || undefined,
            image_url: e.logo_url || undefined,
            slug: e.slug,
          });
        });
      }

      // Search segments (categories)
      const { data: segments } = await supabase
        .from("segments")
        .select("id, name, icon")
        .eq("is_active", true)
        .ilike("name", `%${query}%`)
        .limit(3);

      if (segments) {
        segments.forEach((s) => {
          searchResults.push({
            id: s.id,
            type: "category",
            name: s.name,
            description: s.icon || undefined,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("vilafood_recent_searches", JSON.stringify(updated));

    // Navigate based on result type
    if (result.type === "product" && result.establishment_slug) {
      navigate(`/loja/${result.establishment_slug}`);
    } else if (result.type === "establishment" && result.slug) {
      navigate(`/loja/${result.slug}`);
    } else if (result.type === "category") {
      // Find matching main category
      const categoryMap: Record<string, string> = {
        pizzaria: "comida",
        hamburgueria: "comida",
        restaurante: "comida",
        mercado: "mercado",
        farmacia: "farmacia",
        loja: "compras",
        artesanato: "artesanato",
      };
      const mainCat = Object.entries(categoryMap).find(([key]) => 
        result.name.toLowerCase().includes(key)
      );
      if (mainCat) {
        navigate(`/categoria/${mainCat[1]}`);
      }
    }

    onClose();
  };

  const handleRecentClick = (term: string) => {
    setSearchTerm(term);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("vilafood_recent_searches");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4 text-muted-foreground" />;
      case "establishment":
        return <Store className="h-4 w-4 text-muted-foreground" />;
      case "category":
        return <Utensils className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-primary p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produtos, lojas ou categorias..."
            className="pl-10 pr-10 rounded-full bg-background"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {!loading && searchTerm.length >= 2 && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum resultado encontrado para "{searchTerm}"</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                {result.image_url ? (
                  <img
                    src={result.image_url}
                    alt={result.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    {getIcon(result.type)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{result.type}</p>
                </div>
                
                <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Recent searches */}
        {!loading && searchTerm.length < 2 && recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Buscas recentes</h3>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-primary hover:underline"
              >
                Limpar
              </button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentClick(term)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{term}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSearch;
