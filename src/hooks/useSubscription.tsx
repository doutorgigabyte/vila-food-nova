import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plan } from "@/hooks/usePlans";

interface SubscribeParams {
  planId: string;
  establishmentId: string;
  payerEmail: string;
  isYearly: boolean;
}

interface SubscriptionStatus {
  status: string;
  next_payment_date?: string;
  last_modified?: string;
}

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const subscribe = async ({ planId, establishmentId, payerEmail, isYearly }: SubscribeParams) => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Você precisa estar logado para assinar um plano");
      }

      const backUrl = `${window.location.origin}/assinatura/resultado`;

      const { data, error } = await supabase.functions.invoke("mercadopago-subscription", {
        body: {
          action: "subscribe",
          plan_id: planId,
          establishment_id: establishmentId,
          payer_email: payerEmail,
          back_url: backUrl,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao criar assinatura");

      // Redirect to Mercado Pago checkout
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("Link de pagamento não gerado");
      }

      return data;
    } catch (error) {
      console.error("Subscribe error:", error);
      toast({
        title: "Erro na assinatura",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (establishmentId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-subscription", {
        body: {
          action: "cancel",
          establishment_id: establishmentId,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao cancelar assinatura");

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso.",
      });

      return data;
    } catch (error) {
      console.error("Cancel subscription error:", error);
      toast({
        title: "Erro ao cancelar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionStatus = async (establishmentId: string): Promise<SubscriptionStatus | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-subscription", {
        body: {
          action: "get_status",
          establishment_id: establishmentId,
        },
      });

      if (error) throw error;
      if (!data.success) return null;

      return {
        status: data.status,
        next_payment_date: data.next_payment_date,
        last_modified: data.last_modified,
      };
    } catch (error) {
      console.error("Get subscription status error:", error);
      return null;
    }
  };

  return {
    subscribe,
    cancelSubscription,
    getSubscriptionStatus,
    isLoading,
  };
};

// Hook to sync plans with Mercado Pago (admin only)
export const useSyncPlansWithMP = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const syncPlan = async (plan: Plan) => {
    const { data, error } = await supabase.functions.invoke("mercadopago-subscription", {
      body: {
        action: "create_plan",
        plan_id: plan.id,
        plan_data: {
          reason: `VilaFood - Plano ${plan.name}`,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: plan.price_monthly || plan.price,
            currency_id: "BRL",
          },
        },
        back_url: `${window.location.origin}/assinatura/resultado`,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || "Erro ao sincronizar plano");
    
    return data;
  };

  const syncAllPlans = async (plans: Plan[]) => {
    setIsLoading(true);
    setProgress({ current: 0, total: plans.length });
    
    const results: { plan: Plan; success: boolean; error?: string }[] = [];

    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      setProgress({ current: i + 1, total: plans.length });
      
      try {
        // Skip free plans
        if ((plan.price_monthly || plan.price) <= 0) {
          results.push({ plan, success: true });
          continue;
        }
        
        await syncPlan(plan);
        results.push({ plan, success: true });
      } catch (error) {
        results.push({ 
          plan, 
          success: false, 
          error: error instanceof Error ? error.message : "Erro desconhecido" 
        });
      }
    }

    setIsLoading(false);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount > 0) {
      toast({
        title: "Sincronização parcial",
        description: `${successCount} planos sincronizados, ${failCount} com erro`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sincronização completa",
        description: `${successCount} planos sincronizados com Mercado Pago`,
      });
    }

    return results;
  };

  return {
    syncPlan,
    syncAllPlans,
    isLoading,
    progress,
  };
};
