import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, Loader2 } from "lucide-react";
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
          {recommendations.map((rec) => (
            <Card key={rec.product.id} className="overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">{rec.product.name}</h4>
                    {rec.product.promotional_price && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Promo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-primary/80 mt-0.5 italic flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    "{rec.reason}"
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-sm text-primary">
                      R$ {(rec.product.promotional_price || rec.product.price).toFixed(2)}
                    </span>
                    {rec.product.promotional_price && (
                      <span className="text-xs text-muted-foreground line-through">
                        R$ {rec.product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-primary/30 hover:bg-primary hover:text-primary-foreground"
                  onClick={() => onAddToCart({
                    id: rec.product.id,
                    name: rec.product.name,
                    description: rec.product.description,
                    price: rec.product.promotional_price || rec.product.price,
                    promotional_price: rec.product.promotional_price,
                    image_url: null
                  })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>
          ))}
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
