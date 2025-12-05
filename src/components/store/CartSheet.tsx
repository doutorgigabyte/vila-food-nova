import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { AIRecommendations } from "./AIRecommendations";
import type { StoreProduct } from "@/hooks/useStoreData";

export interface CartItem {
  product: StoreProduct;
  quantity: number;
  observation: string;
}

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  establishmentId: string;
  establishmentSlug: string;
  deliveryFee: number;
  minOrder: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onAddProduct: (product: any) => void;
}

export const CartSheet = ({
  isOpen,
  onClose,
  items,
  establishmentId,
  establishmentSlug,
  deliveryFee,
  minOrder,
  onUpdateQuantity,
  onRemove,
  onAddProduct
}: CartSheetProps) => {
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.promotional_price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  
  const total = subtotal + deliveryFee;
  const canCheckout = subtotal >= minOrder;

  const cartItemsForAI = items.map(item => ({
    id: item.product.id,
    name: item.product.name,
    price: item.product.promotional_price || item.product.price,
    quantity: item.quantity,
    category: item.product.category?.name
  }));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Seu Pedido
            {items.length > 0 && (
              <Badge variant="secondary">{items.reduce((sum, i) => sum + i.quantity, 0)}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg">Carrinho vazio</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Adicione itens do cardápio para começar seu pedido
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* AI Recommendations */}
              <AIRecommendations
                establishmentId={establishmentId}
                cartItems={cartItemsForAI}
                onAddToCart={onAddProduct}
              />

              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => {
                  const price = item.product.promotional_price || item.product.price;
                  return (
                    <div key={item.product.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          {item.observation && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              "{item.observation}"
                            </p>
                          )}
                          <span className="text-sm font-semibold text-primary">
                            R$ {(price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => onRemove(item.product.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-background">
            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>R$ {deliveryFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Min order warning */}
            {!canCheckout && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded text-center">
                Pedido mínimo: R$ {minOrder.toFixed(2)} (faltam R$ {(minOrder - subtotal).toFixed(2)})
              </p>
            )}

            {/* Checkout Button */}
            <Button 
              className="w-full h-12 text-base font-semibold" 
              disabled={!canCheckout}
              asChild
            >
              <Link to={`/checkout?store=${establishmentSlug}`}>
                Finalizar Pedido
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
