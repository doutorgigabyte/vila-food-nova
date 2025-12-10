import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishmentPlan } from "@/hooks/useEstablishmentPlan";
import { QuotaBar } from "./QuotaBar";

interface PlanUsageOverviewProps {
  establishmentId: string;
  establishmentSlug?: string;
}

export const PlanUsageOverview = ({ establishmentId, establishmentSlug }: PlanUsageOverviewProps) => {
  const navigate = useNavigate();
  const { planFeatures, isLoading: planLoading, isPlanFree, getUpgradeSuggestion } = useEstablishmentPlan(establishmentId);

  // Fetch current usage counts
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["establishment-usage", establishmentId],
    queryFn: async () => {
      const [products, videos, users, orders] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("establishment_id", establishmentId),
        supabase.from("establishment_videos").select("id", { count: "exact", head: true }).eq("establishment_id", establishmentId),
        supabase.from("establishment_users").select("id", { count: "exact", head: true }).eq("establishment_id", establishmentId).eq("is_active", true),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("establishment_id", establishmentId).gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      return {
        products: products.count || 0,
        videos: videos.count || 0,
        users: users.count || 0,
        ordersThisMonth: orders.count || 0,
      };
    },
    enabled: !!establishmentId,
  });

  const isLoading = planLoading || usageLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const upgradeSuggestion = getUpgradeSuggestion();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            Seu Plano
            <Badge variant={isPlanFree() ? "secondary" : "default"}>
              {planFeatures.planName}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isPlanFree() 
              ? "Faça upgrade para desbloquear mais recursos"
              : `R$ ${planFeatures.priceMonthly.toFixed(2).replace(".", ",")}/mês`
            }
          </CardDescription>
        </div>
        {upgradeSuggestion && (
          <Button 
            size="sm" 
            onClick={() => navigate(establishmentSlug ? `/painel/${establishmentSlug}/upgrade` : "/precos")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <QuotaBar 
          label="Produtos" 
          current={usage?.products || 0} 
          max={planFeatures.maxProducts} 
        />
        <QuotaBar 
          label="Pedidos este mês" 
          current={usage?.ordersThisMonth || 0} 
          max={planFeatures.maxOrders} 
        />
        <QuotaBar 
          label="Vídeos VilaTok" 
          current={usage?.videos || 0} 
          max={planFeatures.maxVideos} 
        />
        <QuotaBar 
          label="Usuários" 
          current={usage?.users || 0} 
          max={planFeatures.maxUsers} 
        />
      </CardContent>
    </Card>
  );
};
