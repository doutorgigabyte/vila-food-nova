import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, Loader2, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface Recommendation {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    promotional_price: number | null;
    image_url: string | null;
    category: string | null;
  };
  reason: string;
}

interface AIRecommendationsProps {
  establishmentId: string;
  cartItems: CartItem[];
  onAddToCart: (product: any) => void;
}

export const AIRecommendations = ({ 
  establishmentId, 
  cartItems, 
  onAddToCart 
}: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (cartItems.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("ai-recommendations", {
          body: {
            establishment_id: establishmentId,
            cart_items: cartItems,
            limit: 3
          }
        });

        if (fnError) throw fnError;
        
        if (data?.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (err: any) {
        console.error("Error fetching recommendations:", err);
        setError("Não foi possível carregar recomendações");
      } finally {
        setLoading(false);
      }
    };

    // Debounce the request
    const timeoutId = setTimeout(fetchRecommendations, 500);
    return () => clearTimeout(timeoutId);
  }, [establishmentId, cartItems]);

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set(prev).add(productId));
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-primary/20 rounded-full">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-sm">Recomendações da IA</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          Personalizado
        </Badge>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Analisando seu pedido...</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-muted-foreground py-2">{error}</p>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const hasImageError = imageErrors.has(rec.product.id);
            const showImage = rec.product.image_url && !hasImageError;
            
            return (
              <Card 
                key={rec.product.id} 
                className="overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Product Image - Prominent Display */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-muted/30">
                      {showImage ? (
                        <img
                          src={rec.product.image_url!}
                          alt={rec.product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => handleImageError(rec.product.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <ImageOff className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                      
                      {/* Promotional Badge on Image */}
                      {rec.product.promotional_price && rec.product.promotional_price < rec.product.price && (
                        <div className="absolute top-1 left-1">
                          <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 shadow-sm">
                            -{Math.round(((rec.product.price - rec.product.promotional_price) / rec.product.price) * 100)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="font-semibold text-sm truncate">{rec.product.name}</h4>
                        <p className="text-xs text-primary/80 mt-0.5 italic flex items-start gap-1 line-clamp-2">
                          <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>"{rec.reason}"</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-base text-primary">
                            R$ {(rec.product.promotional_price || rec.product.price).toFixed(2)}
                          </span>
                          {rec.product.promotional_price && rec.product.promotional_price < rec.product.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              R$ {rec.product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground touch-manipulation active:scale-95 transition-transform"
                          onClick={() => onAddToCart({
                            id: rec.product.id,
                            name: rec.product.name,
                            description: rec.product.description,
                            price: rec.product.promotional_price || rec.product.price,
                            promotional_price: rec.product.promotional_price,
                            image_url: rec.product.image_url
                          })}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && recommendations.length === 0 && cartItems.length > 0 && (
        <p className="text-sm text-muted-foreground py-2">
          Continue adicionando itens para receber sugestões personalizadas!
        </p>
      )}
    </div>
  );
};
