import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles, ShoppingBag } from "lucide-react";
import { Price } from "@/components/ui/price";
import { CartItem, EstablishmentInfo, useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RelatedProductsProps {
  currentItems: CartItem[];
  establishments: Map<string, EstablishmentInfo>;
  onProductAdded?: (productId: string) => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  establishment_id: string;
  product_type: string | null;
  temperature_options: string[] | null;
}

const RELATED_KEYWORDS: Record<string, string[]> = {
  'refrigerante': ['gelo', 'copo'],
  'pizza': ['refrigerante', 'suco'],
  'hamburguer': ['refrigerante', 'batata'],
  'açaí': ['granola', 'banana'],
  'acai': ['granola', 'banana'],
  'pastel': ['suco', 'refrigerante'],
  'bolo': ['cafe', 'suco'],
};

export const RelatedProducts = ({
  currentItems,
  establishments,
  onProductAdded,
}: RelatedProductsProps) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentItems]);

  const fetchRelatedProducts = async () => {
    if (currentItems.length === 0) {
      setRelatedProducts([]);
      setLoading(false);
      return;
    }

    try {
      const establishmentIds = [...new Set(currentItems.map(item => item.product.establishment_id))];
      const currentProductIds = currentItems.map(item => item.product.id);
      
      // Query products from the first establishment
      const primaryEstablishmentId = establishmentIds[0];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, promotional_price, image_url, establishment_id, product_type, temperature_options')
        .match({ establishment_id: primaryEstablishmentId, is_available: true })
        .limit(10);

      if (error) throw error;

      const filtered = ((data as Product[]) || [])
        .filter((p) => !currentProductIds.includes(p.id))
        .slice(0, 4);
      
      setRelatedProducts(filtered);
    } catch (error) {
      console.error('[RelatedProducts] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product: Product) => {
    setAddingProduct(product.id);
    
    const establishmentInfo = establishments.get(product.establishment_id);
    if (!establishmentInfo) {
      toast.error("Erro ao adicionar produto");
      setAddingProduct(null);
      return;
    }

    const success = await addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        promotional_price: product.promotional_price,
        image_url: product.image_url,
        establishment_id: product.establishment_id,
        product_type: product.product_type || undefined,
        temperature_options: product.temperature_options || undefined,
      },
      establishmentInfo,
      1,
      ""
    );

    if (success) {
      toast.success("Produto adicionado!");
      onProductAdded?.(product.id);
      setRelatedProducts(prev => prev.filter(p => p.id !== product.id));
    }
    
    setAddingProduct(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-28 flex-shrink-0 animate-pulse">
                <div className="w-full h-20 bg-muted rounded-lg" />
                <div className="h-3 bg-muted rounded mt-2 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedProducts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Que tal pedir também?
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {relatedProducts.map((product) => {
            const price = product.promotional_price || product.price;
            const isAdding = addingProduct === product.id;
            
            return (
              <div 
                key={product.id} 
                className="w-28 flex-shrink-0 bg-muted/30 rounded-xl p-2 border border-border/50"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <h4 className="text-xs font-medium line-clamp-2 mb-1 h-8">{product.name}</h4>
                <Price value={price} size="xs" />
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full mt-2 h-7 text-xs"
                  onClick={() => handleAddProduct(product)}
                  disabled={isAdding}
                >
                  {isAdding ? "..." : <><Plus className="w-3 h-3 mr-1" />Adicionar</>}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
