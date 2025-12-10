import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Plan } from "@/hooks/usePlans";

interface PlanCardProps {
  plan: Plan;
  isYearly?: boolean;
  currentPlanId?: string | null;
  onSelect?: (plan: Plan) => void;
  showCTA?: boolean;
}

export const PlanCard = ({ 
  plan, 
  isYearly = false, 
  currentPlanId,
  onSelect,
  showCTA = true 
}: PlanCardProps) => {
  const isCurrentPlan = currentPlanId === plan.id;
  const isFree = plan.price === 0;
  const price = isYearly && plan.price_yearly ? plan.price_yearly : plan.price_monthly || plan.price;
  const monthlyEquivalent = isYearly ? (plan.price_yearly || 0) / 12 : price;

  const features = plan.features || [];

  return (
    <Card className={cn(
      "relative flex flex-col transition-all duration-300",
      plan.is_popular && "border-primary shadow-lg scale-105",
      isCurrentPlan && "ring-2 ring-primary"
    )}>
      {plan.is_popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          <Star className="h-3 w-3 mr-1 fill-current" />
          Mais Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
          {isFree ? (
            <div className="text-4xl font-bold text-foreground">Grátis</div>
          ) : (
            <>
              <div className="text-4xl font-bold text-foreground">
                R$ {monthlyEquivalent.toFixed(2).replace(".", ",")}
              </div>
              <div className="text-sm text-muted-foreground">
                {isYearly ? "/mês (cobrado anualmente)" : "/mês"}
              </div>
              {isYearly && plan.price_monthly && (
                <div className="text-xs text-green-600 mt-1">
                  Economize R$ {((plan.price_monthly * 12) - (plan.price_yearly || 0)).toFixed(2).replace(".", ",")} por ano
                </div>
              )}
            </>
          )}
        </div>

        <ul className="space-y-2.5">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Limites do plano */}
        <div className="mt-4 pt-4 border-t space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Produtos</span>
            <span className="font-medium">
              {plan.max_products === -1 ? "Ilimitado" : plan.max_products}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Pedidos/mês</span>
            <span className="font-medium">
              {plan.max_orders === -1 ? "Ilimitado" : plan.max_orders}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Vídeos VilaTok</span>
            <span className="font-medium">
              {plan.max_videos === -1 ? "Ilimitado" : plan.max_videos}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Usuários</span>
            <span className="font-medium">
              {plan.max_users === -1 ? "Ilimitado" : plan.max_users}
            </span>
          </div>
        </div>
      </CardContent>

      {showCTA && (
        <CardFooter>
          <Button
            className="w-full"
            variant={plan.is_popular ? "default" : "outline"}
            disabled={isCurrentPlan}
            onClick={() => onSelect?.(plan)}
          >
            {isCurrentPlan ? "Plano Atual" : isFree ? "Começar Grátis" : "Escolher Plano"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
