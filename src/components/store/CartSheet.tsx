import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, Store, AlertTriangle } from "lucide-react";
import { AIRecommendations } from "./AIRecommendations";
import { useCart, type CartProduct, type EstablishmentInfo } from "@/hooks/useCart";

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  establishmentId: string;
  establishmentSlug: string;
}

export const CartSheet = ({
  isOpen,
  onClose,
  establishmentId,
  establishmentSlug,
}: CartSheetProps) => {
  const navigate = useNavigate();
  const {
    items,
    establishments,
    updateQuantity,
    removeFromCart,
    addToCart,
    getEstablishmentItems,
    getEstablishmentSubtotal,
    getTotalItems,
    getTotalPrice,
    isMultiEstablishment,
    getUniqueEstablishments,
  } = useCart();

  const currentEstablishment = establishments.get(establishmentId);
  const currentEstablishmentItems = getEstablishmentItems(establishmentId);
  const currentSubtotal = getEstablishmentSubtotal(establishmentId);
  
  const isMultiStore = isMultiEstablishment();
  const uniqueEstablishments = getUniqueEstablishments();
  const otherEstablishments = uniqueEstablishments.filter(id => id !== establishmentId);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  
  const deliveryFee = currentEstablishment?.delivery_base_fee || 0;
  const minOrder = currentEstablishment?.min_order_value || 0;
  const canCheckout = currentSubtotal >= minOrder || totalPrice >= minOrder;

  const cartItemsForAI = currentEstablishmentItems.map(item => ({
    id: item.product.id,
    name: item.product.name,
    price: item.product.promotional_price || item.product.price,
    quantity: item.quantity,
    category: undefined
  }));

  const handleAddRecommendedProduct = async (product: any) => {
    if (!currentEstablishment) return;
    
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      promotional_price: product.promotional_price,
      image_url: product.image_url,
      establishment_id: establishmentId,
    };

    await addToCart(cartProduct, currentEstablishment);
  };

  const handleCheckout = () => {
    onClose();
    navigate(`/checkout?store=${establishmentSlug}`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Seu Pedido
            {totalItems > 0 && (
              <Badge variant="secondary">{totalItems}</Badge>
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
              {/* Multi-establishment warning */}
              {isMultiStore && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Pedido em {uniqueEstablishments.length} estabelecimentos
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                        No checkout, cada estabelecimento processará seu pedido separadamente. Apenas retirada no local.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Recommendations */}
              {currentEstablishmentItems.length > 0 && (
                <AIRecommendations
                  establishmentId={establishmentId}
                  cartItems={cartItemsForAI}
                  onAddToCart={handleAddRecommendedProduct}
                />
              )}

              {/* Current Establishment Items */}
              {currentEstablishmentItems.length > 0 && (
                <div className="space-y-3">
                  {isMultiStore && currentEstablishment && (
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Store className="w-4 h-4" />
                      {currentEstablishment.name}
                    </div>
                  )}
                  {currentEstablishmentItems.map((item) => {
                    const price = item.product.promotional_price || item.product.price;
                    return (
                      <div key={item.product.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          {item.product.image_url && (
                            <img 
                              src={item.product.image_url} 
                              alt={item.product.name}
                              className="w-14 h-14 rounded-lg object-cover"
                            />
                          )}
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
                              onClick={() => updateQuantity(item.product.id, -1)}
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
                              onClick={() => updateQuantity(item.product.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Other Establishments Items */}
              {otherEstablishments.map((estId) => {
                const estInfo = establishments.get(estId);
                const estItems = getEstablishmentItems(estId);
                if (estItems.length === 0) return null;
                
                return (
                  <div key={estId} className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {estInfo?.logo_url && (
                        <img src={estInfo.logo_url} alt={estInfo.name} className="w-5 h-5 rounded-full" />
                      )}
                      {estInfo?.name || "Outro estabelecimento"}
                      <Badge variant="outline" className="text-xs">
                        {estItems.reduce((s, i) => s + i.quantity, 0)} itens
                      </Badge>
                    </div>
                    {estItems.map((item) => {
                      const price = item.product.promotional_price || item.product.price;
                      return (
                        <div key={item.product.id} className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            {item.product.image_url && (
                              <img 
                                src={item.product.image_url} 
                                alt={item.product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{item.product.name}</h4>
                              <span className="text-sm font-semibold text-primary">
                                R$ {(price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.product.id, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-5 text-center text-xs font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.product.id, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-background">
            {/* Summary */}
            <div className="space-y-2 text-sm">
              {isMultiStore ? (
                <>
                  {uniqueEstablishments.map((estId) => {
                    const estInfo = establishments.get(estId);
                    const estSubtotal = getEstablishmentSubtotal(estId);
                    return (
                      <div key={estId} className="flex justify-between">
                        <span className="text-muted-foreground">{estInfo?.name}</span>
                        <span>R$ {estSubtotal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {currentSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>R$ {(isMultiStore ? totalPrice : currentSubtotal + deliveryFee).toFixed(2)}</span>
              </div>
            </div>

            {/* Min order warning */}
            {!canCheckout && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded text-center">
                Pedido mínimo: R$ {minOrder.toFixed(2)} (faltam R$ {(minOrder - currentSubtotal).toFixed(2)})
              </p>
            )}

            {/* Checkout Button */}
            <Button 
              className="w-full h-12 text-base font-semibold" 
              disabled={!canCheckout}
              onClick={handleCheckout}
            >
              Finalizar Pedido
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
