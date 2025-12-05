import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Package, Clock } from "lucide-react";
import type { StoreProduct } from "@/hooks/useStoreData";

interface ProductModalProps {
  product: StoreProduct | null;
  onClose: () => void;
  onAddToCart: (product: StoreProduct, quantity: number, observation: string) => void;
}

export const ProductModal = ({ product, onClose, onAddToCart }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState("");
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  // Safe discount calculation
  const hasPromo = Boolean(
    product.promotional_price && 
    product.promotional_price > 0 && 
    product.promotional_price < product.price
  );
  const displayPrice = hasPromo ? product.promotional_price! : product.price;
  const total = displayPrice * quantity;
  const discount = hasPromo
    ? Math.round(((product.price - product.promotional_price!) / product.price) * 100)
    : 0;
  const showImage = product.image_url && !imageError;

  const handleAdd = () => {
    onAddToCart(product, quantity, observation);
    setQuantity(1);
    setObservation("");
    onClose();
  };

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Product Image */}
        <div className="relative h-56 bg-muted">
          {showImage ? (
            <img
              src={product.image_url!}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Package className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          {hasPromo && discount > 0 && (
            <Badge variant="destructive" className="absolute top-3 left-3 text-sm px-3 py-1 shadow-lg">
              -{discount}% OFF
            </Badge>
          )}
        </div>

        <div className="p-6 space-y-4">
          <DialogHeader className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <DialogTitle className="text-xl">{product.name}</DialogTitle>
              {product.preparation_time && (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Clock className="w-3 h-3" />
                  {product.preparation_time} min
                </Badge>
              )}
            </div>
            {product.category && (
              <Badge variant="outline" className="w-fit">{product.category.name}</Badge>
            )}
          </DialogHeader>

          {product.description && (
            <p className="text-muted-foreground text-sm">{product.description}</p>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">
              R$ {displayPrice.toFixed(2)}
            </span>
            {hasPromo && (
              <span className="text-lg text-muted-foreground line-through">
                R$ {product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Observation */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Alguma observação?</label>
            <Textarea
              placeholder="Ex: Sem cebola, ponto da carne bem passado..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 bg-muted rounded-full p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold w-6 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button 
              className="flex-1 h-12 text-base font-semibold"
              onClick={handleAdd}
            >
              Adicionar • R$ {total.toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
