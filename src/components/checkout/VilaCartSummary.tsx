import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package } from "lucide-react";
import { CartItem, EstablishmentInfo } from "@/hooks/useCart";

interface VilaCartSummaryProps {
  itemsByEstablishment: Record<string, CartItem[]>;
  establishments: Record<string, EstablishmentInfo>;
  getEstablishmentSubtotal: (establishmentId: string) => number;
  totalAmount: number;
}

export function VilaCartSummary({
  itemsByEstablishment,
  establishments,
  getEstablishmentSubtotal,
  totalAmount
}: VilaCartSummaryProps) {
  const establishmentIds = Object.keys(itemsByEstablishment);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Resumo do Pedido ({establishmentIds.length} {establishmentIds.length === 1 ? 'loja' : 'lojas'})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {establishmentIds.map((estId, index) => {
          const items = itemsByEstablishment[estId];
          const establishment = establishments[estId];
          const subtotal = getEstablishmentSubtotal(estId);

          return (
            <div key={estId} className="space-y-2">
              {index > 0 && <div className="border-t border-border/30 pt-3" />}
              
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>{establishment?.name || 'Loja'}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Loja {index + 1}/{establishmentIds.length}
                </span>
              </div>

              <div className="space-y-1 pl-6">
                {items.map((item, itemIndex) => {
                  const price = item.product.promotional_price || item.product.price;
                  return (
                    <div key={itemIndex} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="text-foreground">
                        R$ {(price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-sm font-medium pl-6 pt-1 border-t border-dashed border-border/30">
                <span>Subtotal {establishment?.name}</span>
                <span className="text-primary">R$ {subtotal.toFixed(2)}</span>
              </div>
            </div>
          );
        })}

        <div className="border-t-2 border-border pt-3 mt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total Geral</span>
            <span className="text-primary">R$ {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
