import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePlans, type Plan } from "@/hooks/usePlans";
import { PlanCard } from "./PlanCard";

interface PlanSelectorProps {
  currentPlanId?: string | null;
  onSelect?: (plan: Plan, isYearly: boolean) => void;
}

export const PlanSelector = ({ currentPlanId, onSelect }: PlanSelectorProps) => {
  const [isYearly, setIsYearly] = useState(false);
  const { data: plans, isLoading } = usePlans();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toggle Mensal/Anual */}
      <div className="flex items-center justify-center gap-4">
        <Label 
          htmlFor="billing-toggle" 
          className={!isYearly ? "font-semibold" : "text-muted-foreground"}
        >
          Mensal
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label 
          htmlFor="billing-toggle" 
          className={isYearly ? "font-semibold" : "text-muted-foreground"}
        >
          Anual
          <span className="ml-2 text-xs text-green-600 font-normal">
            (20% off)
          </span>
        </Label>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans?.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isYearly={isYearly}
            currentPlanId={currentPlanId}
            onSelect={(p) => onSelect?.(p, isYearly)}
          />
        ))}
      </div>
    </div>
  );
};
