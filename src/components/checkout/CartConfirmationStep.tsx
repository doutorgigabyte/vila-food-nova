import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ChevronRight, Gift, Truck, ShoppingBag } from "lucide-react";
import { Price } from "@/components/ui/price";
import { CartItem, EstablishmentInfo, getTemperatureOptions } from "@/hooks/useCart";
import { RelatedProducts } from "./RelatedProducts";
import { TemperatureSelector, TemperatureOption } from "@/components/products/TemperatureSelector";
import { cn } from "@/lib/utils";

interface CartConfirmationStepProps {
  items: CartItem[];
  establishments: Map<string, EstablishmentInfo>;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onTemperatureChange: (productId: string, temperature: TemperatureOption) => void;
  onContinue: () => void;
  subtotal: number;
  freeDeliveryThreshold?: number;
}

export const CartConfirmationStep = ({
  items,
  establishments,
  onUpdateQuantity,
  onRemove,
  onTemperatureChange,
  onContinue,
  subtotal,
  freeDeliveryThreshold = 50,
}: CartConfirmationStepProps) => {
  const [addedFromRelated, setAddedFromRelated] = useState<string[]>([]);
  
  const amountForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const hasFreeDelivery = subtotal >= freeDeliveryThreshold;

  // Get first establishment for store link
  const firstEstablishment = establishments.values().next().value;
  const storeSlug = firstEstablishment?.slug;

  return (
    <div className="space-y-4">
      {/* Free Delivery Banner */}
      {!hasFreeDelivery && amountForFreeDelivery > 0 && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-full">
              <Truck className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Adicione <Price value={amountForFreeDelivery} size="sm" className="text-green-700 dark:text-green-400 inline" /> e ganhe entrega grátis!
              </p>
              <div className="mt-1 h-1.5 bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasFreeDelivery && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-full">
              <Gift className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Parabéns! Você ganhou entrega grátis!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cart Items */}
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {items.map((item) => {
            const price = item.product.promotional_price || item.product.price;
            const hasDiscount = item.product.promotional_price && item.product.promotional_price < item.product.price;
            const isNew = addedFromRelated.includes(item.product.id);
            
            // Get temperature options for this product
            const temperatureOptions = getTemperatureOptions(
              item.product.product_type,
              item.product.temperature_options
            );
            const showTemperatureSelector = temperatureOptions.length > 0;
            
            return (
              <div 
                key={item.product.id} 
                className={cn(
                  "p-4 transition-colors",
                  isNew && "bg-primary/5"
                )}
              >
                <div className="flex gap-3">
                  {/* Product Image */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {hasDiscount && (
                      <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] px-1">
                        -{Math.round(((item.product.price - (item.product.promotional_price || 0)) / item.product.price) * 100)}%
                      </Badge>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                    {item.observation && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {item.observation}
                      </p>
                    )}
                    <div className="mt-1">
                      <Price 
                        value={price * item.quantity} 
                        originalValue={hasDiscount ? item.product.price * item.quantity : undefined}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => onRemove(item.product.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-background hover:bg-accent transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-background hover:bg-accent transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Temperature Selector - Only for eligible products */}
                {showTemperatureSelector && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <TemperatureSelector
                      options={temperatureOptions}
                      value={item.selectedTemperature || null}
                      onChange={(temp) => onTemperatureChange(item.product.id, temp)}
                      variant="compact"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Add More Products Link */}
      {storeSlug && (
        <Link
          to={`/loja/${storeSlug}`}
          className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-sm">Adicionar mais produtos</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>
      )}

      {/* Related Products Section */}
      <RelatedProducts
        currentItems={items}
        establishments={establishments}
        onProductAdded={(productId) => setAddedFromRelated(prev => [...prev, productId])}
      />

      {/* Continue Button */}
      <div className="pt-4">
        <Button onClick={onContinue} className="w-full h-12 text-base font-semibold">
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};
