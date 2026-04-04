import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowUpRight, Store, Package, Utensils, MapPin, TrendingUp, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { safeLocalStorage } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  type: "product" | "establishment" | "category" | "vila";
  name: string;
  description?: string;
  image_url?: string;
  slug?: string;
  establishment_slug?: string;
  price?: number;
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = safeLocalStorage.getItem("vilafood_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setSearchTerm("");
      setResults([]);
      setSelectedIndex(-1);
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

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Parallel searches for better performance
      const [productsRes, establishmentsRes, vilasRes, segmentsRes] = await Promise.all([
        supabase
          .from("products")
          .select(`id, name, description, image_url, price, establishments:establishment_id (slug)`)
          .eq("is_active", true)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(8),
        supabase
          .from("establishments")
          .select("id, name, description, logo_url, slug")
          .eq("status", "active")
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5),
        supabase
          .from("vilas")
          .select("id, name, slug, image_url")
          .eq("is_active", true)
          .ilike("name", `%${query}%`)
          .limit(3),
        supabase
          .from("segments")
          .select("id, name, icon")
          .eq("is_active", true)
          .ilike("name", `%${query}%`)
          .limit(3)
      ]);

      if (productsRes.data) {
        productsRes.data.forEach((p: any) => {
          searchResults.push({
            id: p.id,
            type: "product",
            name: p.name,
            description: p.description,
            image_url: p.image_url,
            establishment_slug: p.establishments?.slug,
            price: p.price,
          });
        });
      }

      if (establishmentsRes.data) {
        establishmentsRes.data.forEach((e) => {
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

      if (vilasRes.data) {
        vilasRes.data.forEach((v) => {
          searchResults.push({
            id: v.id,
            type: "vila",
            name: v.name,
            image_url: v.image_url || undefined,
            slug: v.slug,
          });
        });
      }

      if (segmentsRes.data) {
        segmentsRes.data.forEach((s) => {
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

  const handleResultClick = useCallback((result: SearchResult) => {
    // Save to recent searches
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 10);
    setRecentSearches(updated);
    safeLocalStorage.setItem("vilafood_recent_searches", JSON.stringify(updated));

    // Navigate based on result type
    if (result.type === "product" && result.establishment_slug) {
      navigate(`/loja/${result.establishment_slug}`);
    } else if (result.type === "establishment" && result.slug) {
      navigate(`/loja/${result.slug}`);
    } else if (result.type === "vila" && result.slug) {
      navigate(`/vila/${result.slug}`);
    } else if (result.type === "category") {
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
  }, [navigate, onClose, recentSearches, searchTerm]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [results, selectedIndex, handleResultClick, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  const handleRecentClick = (term: string) => {
    setSearchTerm(term);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    safeLocalStorage.removeItem("vilafood_recent_searches");
  };

  // Highlight matched text
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4 text-orange-500" />;
      case "establishment":
        return <Store className="h-4 w-4 text-blue-500" />;
      case "vila":
        return <MapPin className="h-4 w-4 text-green-500" />;
      case "category":
        return <Utensils className="h-4 w-4 text-purple-500" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "product": return "Produto";
      case "establishment": return "Loja";
      case "vila": return "Vila";
      case "category": return "Categoria";
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "product": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "establishment": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "vila": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "category": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeOrder = ["establishment", "product", "category", "vila"];
  const typeTitles: Record<string, string> = {
    establishment: "Lojas",
    product: "Produtos",
    category: "Categorias",
    vila: "Vilas"
  };

  const popularCategories = [
    { id: "comida", name: "Comida", icon: "🍔" },
    { id: "mercado", name: "Mercado", icon: "🛒" },
    { id: "farmacia", name: "Farmácia", icon: "💊" },
    { id: "compras", name: "Compras", icon: "🛍️" },
    { id: "artesanato", name: "Artesanato", icon: "🎨" },
    { id: "servicos", name: "Serviços", icon: "🔧" },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="sticky top-0 bg-primary p-4 flex items-center gap-3 shadow-lg"
        >
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
              onKeyDown={handleKeyDown}
              placeholder="Buscar produtos, lojas ou categorias..."
              className="pl-10 pr-10 rounded-full bg-background border-0 shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Results */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="relative">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">Buscando...</p>
            </div>
          )}

          {/* No results */}
          {!loading && searchTerm.length >= 2 && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">Nenhum resultado</p>
              <p className="text-sm text-muted-foreground">
                Não encontramos nada para "{searchTerm}"
              </p>
            </motion.div>
          )}

          {/* Grouped Results */}
          {!loading && results.length > 0 && (
            <div className="space-y-4" ref={resultsRef}>
              {typeOrder.map((type) => {
                const items = groupedResults[type];
                if (!items || items.length === 0) return null;
                
                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getIcon(type)}
                      <h3 className="text-sm font-semibold text-foreground">
                        {typeTitles[type]}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        ({items.length})
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {items.map((result, idx) => {
                        const globalIndex = results.indexOf(result);
                        const isSelected = globalIndex === selectedIndex;
                        
                        return (
                          <motion.button
                            key={`${result.type}-${result.id}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => handleResultClick(result)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${
                              isSelected 
                                ? "bg-primary/10 border-primary/30 shadow-sm" 
                                : "border-border hover:bg-muted hover:border-muted-foreground/20"
                            }`}
                          >
                            {result.image_url ? (
                              <img
                                src={result.image_url}
                                alt={result.name}
                                className="w-12 h-12 rounded-lg object-cover shadow-sm"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                {getIcon(result.type)}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {highlightMatch(result.name, searchTerm)}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTypeBadgeColor(result.type)}`}>
                                  {getTypeLabel(result.type)}
                                </span>
                                {result.price && (
                                  <span className="text-xs font-semibold text-primary">
                                    R$ {result.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <ArrowUpRight className={`h-4 w-4 shrink-0 transition-colors ${
                              isSelected ? "text-primary" : "text-muted-foreground"
                            }`} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Popular categories when no search */}
          {!loading && searchTerm.length < 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Categorias populares</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {popularCategories.map((cat, idx) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      navigate(`/categoria/${cat.id}`);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-muted hover:bg-muted/80 hover:shadow-md transition-all active:scale-95"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs font-medium">{cat.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent searches */}
          {!loading && searchTerm.length < 2 && recentSearches.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">Buscas recentes</h3>
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleRecentClick(term)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all text-left group"
                  >
                    <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="flex-1">{term}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Keyboard hint */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-4 left-0 right-0 flex justify-center"
          >
            <div className="bg-muted/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">↑↓</kbd>
              <span>navegar</span>
              <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">Enter</kbd>
              <span>selecionar</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartSearch;
