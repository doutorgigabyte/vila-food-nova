import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Receipt, Tag, Truck, Percent, ShoppingBag } from "lucide-react";
import { Price } from "@/components/ui/price";

interface CheckoutSummaryProps {
  itemsCount: number;
  subtotal: number;
  deliveryFee: number;
  platformFee?: number;
  discount?: number;
  couponCode?: string;
  total: number;
}

export const CheckoutSummary = ({
  itemsCount,
  subtotal,
  deliveryFee,
  platformFee = 0,
  discount = 0,
  couponCode,
  total,
}: CheckoutSummaryProps) => {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Receipt className="w-4 h-4 text-muted-foreground" />
          Resumo do pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Products */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            {itemsCount} {itemsCount === 1 ? 'produto' : 'produtos'}
          </span>
          <Price value={subtotal} size="sm" />
        </div>

        {/* Delivery Fee */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Taxa de entrega
          </span>
          {deliveryFee === 0 ? (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-0">
              Grátis
            </Badge>
          ) : (
            <Price value={deliveryFee} size="sm" />
          )}
        </div>

        {/* Platform Fee */}
        {platformFee > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Taxa de serviço
            </span>
            <Price value={platformFee} size="sm" />
          </div>
        )}

        {/* Discount */}
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Desconto {couponCode && `(${couponCode})`}
            </span>
            <span className="text-green-600 font-medium">
              - <Price value={discount} size="sm" className="text-green-600 inline" />
            </span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total a pagar</span>
          <Price value={total} size="lg" className="text-primary" />
        </div>
      </CardContent>
    </Card>
  );
};
