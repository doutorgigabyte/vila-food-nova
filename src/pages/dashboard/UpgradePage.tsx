import { useParams } from "react-router-dom";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import { useEstablishmentPlan } from "@/hooks/useEstablishmentPlan";
import { usePlanAddons, Plan } from "@/hooks/usePlans";
import { PlanSelector } from "@/components/plans/PlanSelector";
import { PlanUsageOverview } from "@/components/plans/PlanUsageOverview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Plus, Sparkles } from "lucide-react";
import { Price } from "@/components/ui/price";

const UpgradePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { establishmentId, loading: estLoading } = useUserEstablishment();
  const { planFeatures, isLoading: isPlanLoading } = useEstablishmentPlan(establishmentId);
  const { data: addons, isLoading: isAddonsLoading } = usePlanAddons();

  const handlePlanSelect = (plan: Plan, isYearly: boolean) => {
    // TODO: Implement plan upgrade flow with Mercado Pago
    console.log("Selected plan:", plan.id, "Yearly:", isYearly);
  };

  const handleAddonAdd = (addonId: string) => {
    // TODO: Implement addon purchase flow
    console.log("Add addon:", addonId);
  };

  if (estLoading || isPlanLoading || isAddonsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upgrade do Plano</h1>
        <p className="text-muted-foreground">
          Escolha o plano ideal para o seu negócio
        </p>
      </div>

      {/* Current Plan Overview */}
      {establishmentId && (
        <PlanUsageOverview 
          establishmentId={establishmentId} 
          establishmentSlug={slug}
        />
      )}

      {/* Plan Selector */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Planos Disponíveis</h2>
        <PlanSelector
          currentPlanId={planFeatures?.planId}
          onSelect={handlePlanSelect}
        />
      </div>

      {/* Add-ons Section */}
      {addons && addons.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Complementos</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {addons.map((addon) => (
              <Card key={addon.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{addon.name}</CardTitle>
                      <CardDescription>{addon.description}</CardDescription>
                    </div>
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <Price value={addon.price_monthly} size="lg" />
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleAddonAdd(addon.id)}>
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Por que fazer upgrade?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Mais produtos e pedidos para crescer seu negócio",
              "Chatbot com IA para atendimento 24/7",
              "Destaque no marketplace e mais visibilidade",
              "Relatórios avançados e insights de vendas",
              "Suporte prioritário via WhatsApp",
              "Múltiplos usuários e lojas"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradePage;
