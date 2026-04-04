import { useState } from "react";
import { useParams } from "react-router-dom";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import { useEstablishmentPlan } from "@/hooks/useEstablishmentPlan";
import { usePlanAddons, Plan } from "@/hooks/usePlans";
import { useSubscription } from "@/hooks/useSubscription";
import { PlanSelector } from "@/components/plans/PlanSelector";
import { PlanUsageOverview } from "@/components/plans/PlanUsageOverview";
import { SubscriptionConfirmModal } from "@/components/plans/SubscriptionConfirmModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Plus, Sparkles, AlertCircle } from "lucide-react";
import { Price } from "@/components/ui/price";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const UpgradePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { establishmentId, establishment, loading: estLoading } = useUserEstablishment();
  const { planFeatures, isLoading: isPlanLoading } = useEstablishmentPlan(establishmentId);
  const { data: addons, isLoading: isAddonsLoading } = usePlanAddons();
  const { subscribe, isLoading: isSubscribing } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const handlePlanSelect = (plan: Plan, yearly: boolean) => {
    // If it's a free plan, no subscription needed
    if ((plan.price_monthly || plan.price) <= 0) {
      toast({
        title: "Plano Gratuito",
        description: "Este plano não requer pagamento.",
      });
      return;
    }

    // Check if user already has this plan
    if (plan.id === planFeatures?.planId) {
      toast({
        title: "Plano atual",
        description: "Você já está usando este plano.",
      });
      return;
    }

    setSelectedPlan(plan);
    setIsYearly(yearly);
    setConfirmModalOpen(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan || !establishmentId) {
      throw new Error("Selecione um plano");
    }

    // Get user email
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      throw new Error("Email do usuário não encontrado");
    }

    await subscribe({
      planId: selectedPlan.id,
      establishmentId,
      payerEmail: user.email,
      isYearly,
    });
  };

  const handleAddonAdd = (addonId: string) => {
    // TODO: Implement addon purchase flow
    toast({
      title: "Em breve",
      description: "A compra de add-ons estará disponível em breve.",
    });
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

      {/* Current Subscription Alert */}
      {planFeatures?.planName && planFeatures.planName !== "Gratuito" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você está no plano <strong>{planFeatures.planName}</strong>. 
            Ao assinar um novo plano, o anterior será cancelado automaticamente.
          </AlertDescription>
        </Alert>
      )}

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

      {/* Subscription Confirmation Modal */}
      <SubscriptionConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        plan={selectedPlan}
        isYearly={isYearly}
        onConfirm={handleConfirmSubscription}
        isLoading={isSubscribing}
        currentPlanName={planFeatures?.planName}
      />
    </div>
  );
};

export default UpgradePage;
