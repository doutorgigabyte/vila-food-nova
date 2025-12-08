import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanFeatures {
  // Limits
  maxProducts: number | null;
  maxOrders: number | null;
  maxVideos: number | null;
  maxWhatsappMessages: number | null;
  
  // Boolean features
  whatsappChatbot: boolean;
  whatsappAiAgent: boolean;
  aiUnlimited: boolean;
  
  // Feature list
  features: string[];
  
  // Plan info
  planName: string;
  planId: string | null;
}

const DEFAULT_PLAN: PlanFeatures = {
  maxProducts: 10,
  maxOrders: 50,
  maxVideos: 0,
  maxWhatsappMessages: 100,
  whatsappChatbot: false,
  whatsappAiAgent: false,
  aiUnlimited: false,
  features: [],
  planName: "Sem plano",
  planId: null,
};

export const useEstablishmentPlan = (establishmentId: string | null | undefined) => {
  const { data: planFeatures, isLoading } = useQuery({
    queryKey: ["establishment-plan", establishmentId],
    queryFn: async (): Promise<PlanFeatures> => {
      if (!establishmentId) return DEFAULT_PLAN;

      // Get establishment with plan
      const { data: establishment, error: estError } = await supabase
        .from("establishments")
        .select("plan_id")
        .eq("id", establishmentId)
        .single();

      if (estError || !establishment?.plan_id) {
        return DEFAULT_PLAN;
      }

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("id", establishment.plan_id)
        .single();

      if (planError || !plan) {
        return DEFAULT_PLAN;
      }

      return {
        maxProducts: plan.max_products,
        maxOrders: plan.max_orders,
        maxVideos: plan.max_videos ?? 0,
        maxWhatsappMessages: plan.max_whatsapp_messages ?? 0,
        whatsappChatbot: plan.whatsapp_chatbot ?? false,
        whatsappAiAgent: plan.whatsapp_ai_agent ?? false,
        aiUnlimited: plan.ai_unlimited ?? false,
        features: Array.isArray(plan.features) ? (plan.features as unknown as string[]) : [],
        planName: plan.name,
        planId: plan.id,
      };
    },
    enabled: !!establishmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper functions
  const canAddMoreProducts = (currentCount: number): boolean => {
    if (!planFeatures) return true;
    if (planFeatures.maxProducts === null || planFeatures.maxProducts === -1) return true;
    return currentCount < planFeatures.maxProducts;
  };

  const canAddMoreVideos = (currentCount: number): boolean => {
    if (!planFeatures) return false;
    if (planFeatures.maxVideos === null || planFeatures.maxVideos === -1) return true;
    return currentCount < planFeatures.maxVideos;
  };

  const canUseWhatsappChatbot = (): boolean => {
    return planFeatures?.whatsappChatbot ?? false;
  };

  const canUseWhatsappAI = (): boolean => {
    return planFeatures?.whatsappAiAgent ?? false;
  };

  const canUseAI = (): boolean => {
    return planFeatures?.aiUnlimited ?? false;
  };

  const hasFeature = (featureName: string): boolean => {
    if (!planFeatures?.features) return false;
    return planFeatures.features.some(f => 
      f.toLowerCase().includes(featureName.toLowerCase())
    );
  };

  return {
    planFeatures: planFeatures ?? DEFAULT_PLAN,
    isLoading,
    canAddMoreProducts,
    canAddMoreVideos,
    canUseWhatsappChatbot,
    canUseWhatsappAI,
    canUseAI,
    hasFeature,
  };
};
