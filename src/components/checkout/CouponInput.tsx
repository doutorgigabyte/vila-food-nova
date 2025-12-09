import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CouponInputProps {
  establishmentId: string;
  subtotal: number;
  onCouponApplied: (coupon: { code: string; discountValue: number; discountType: string }) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: { code: string; discountValue: number; discountType: string } | null;
}

export const CouponInput = ({
  establishmentId,
  subtotal,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}: CouponInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCoupon = async () => {
    if (!code.trim()) {
      setError("Digite um código de cupom");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('establishment_id', establishmentId)
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError("Cupom inválido ou expirado");
        return;
      }

      // Check validity period
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        setError("Este cupom ainda não está válido");
        return;
      }
      if (data.valid_until && new Date(data.valid_until) < now) {
        setError("Este cupom expirou");
        return;
      }

      // Check usage limit
      if (data.max_uses && data.uses_count >= data.max_uses) {
        setError("Este cupom atingiu o limite de uso");
        return;
      }

      // Check minimum order value
      if (data.min_order_value && subtotal < data.min_order_value) {
        setError(`Valor mínimo do pedido: R$ ${data.min_order_value.toFixed(2)}`);
        return;
      }

      // Calculate discount
      let discountValue = data.discount_value;
      if (data.discount_type === 'percentage') {
        discountValue = (subtotal * data.discount_value) / 100;
      }

      onCouponApplied({
        code: data.code,
        discountValue,
        discountType: data.discount_type || 'fixed',
      });

      toast.success(`Cupom aplicado! Desconto de R$ ${discountValue.toFixed(2)}`);
      setCode("");
    } catch (err) {
      console.error('[CouponInput] Error:', err);
      setError("Erro ao validar cupom");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCode("");
    setError(null);
  };

  if (appliedCoupon) {
    return (
      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500/20 rounded-full">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Cupom aplicado
              </p>
              <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-600 border-0">
                {appliedCoupon.code}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Código do cupom"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              className={cn(
                "pl-10 uppercase",
                error && "border-destructive focus-visible:ring-destructive"
              )}
              onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
            />
          </div>
          <Button
            onClick={validateCoupon}
            disabled={loading || !code.trim()}
            variant="secondary"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Aplicar"
            )}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
            <X className="w-3 h-3" />
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
