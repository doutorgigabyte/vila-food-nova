import { useState } from "react";
import { Loader2, CreditCard, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plan, getYearlyPrice, getYearlySavings } from "@/hooks/usePlans";

interface SubscriptionConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  isYearly: boolean;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
  currentPlanName?: string;
}

export const SubscriptionConfirmModal = ({
  open,
  onOpenChange,
  plan,
  isYearly,
  onConfirm,
  isLoading = false,
  currentPlanName,
}: SubscriptionConfirmModalProps) => {
  const [error, setError] = useState<string | null>(null);

  if (!plan) return null;

  const price = isYearly 
    ? (plan.price_yearly || getYearlyPrice(plan.price_monthly || plan.price)) / 12
    : (plan.price_monthly || plan.price);

  const totalYearly = isYearly ? getYearlyPrice(plan.price_monthly || plan.price) : 0;
  const savings = isYearly ? getYearlySavings(plan.price_monthly || plan.price) : 0;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar assinatura");
    }
  };

  const features = plan.features || [];
  const isUpgrade = currentPlanName && currentPlanName !== plan.name;
  const isDowngrade = currentPlanName && (plan.price_monthly || plan.price) < (plan.price_monthly || plan.price);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Confirmar Assinatura
          </DialogTitle>
          <DialogDescription>
            {isUpgrade 
              ? `Você está fazendo upgrade de ${currentPlanName} para ${plan.name}`
              : `Assinar o plano ${plan.name}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                {plan.is_popular && (
                  <Badge variant="secondary" className="mt-1">Mais Popular</Badge>
                )}
              </div>
              <div className="text-right">
                <Price value={price} size="lg" />
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
            </div>

            {isYearly && (
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total anual</span>
                  <Price value={totalYearly} />
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Você economiza</span>
                  <Price value={savings} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Features Preview */}
          {features.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recursos incluídos:</p>
              <ul className="space-y-1">
                {features.slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {features.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    + {features.length - 5} recursos adicionais
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Billing Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isYearly 
                ? "Você será cobrado anualmente. A renovação é automática."
                : "Você será cobrado mensalmente. A renovação é automática."
              }
              <br />
              <span className="text-xs">Você pode cancelar a qualquer momento.</span>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Ir para Pagamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
