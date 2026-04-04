import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanFeatures {
  // Limits
  maxProducts: number | null;
  maxOrders: number | null;
  maxVideos: number | null;
  maxUsers: number | null;
  maxStores: number | null;
  maxWhatsappMessages: number | null;
  
  // Boolean features
  whatsappChatbot: boolean;
  whatsappAiAgent: boolean;
  chatbotBasic: boolean;
  aiUnlimited: boolean;
  
  // Marketplace
  marketplaceEnabled: boolean;
  marketplaceHighlight: boolean;
  marketplacePriority: number;
  
  // Feature list
  features: string[];
  
  // Plan info
  planName: string;
  planSlug: string | null;
  planId: string | null;
  
  // Pricing
  priceMonthly: number;
  priceYearly: number;
}

export interface EstablishmentAddon {
  id: string;
  addon_id: string;
  addon_name: string;
  addon_slug: string;
  quantity: number;
  is_active: boolean;
}

const DEFAULT_PLAN: PlanFeatures = {
  maxProducts: 10,
  maxOrders: 50,
  maxVideos: 1,
  maxUsers: 1,
  maxStores: 1,
  maxWhatsappMessages: 0,
  whatsappChatbot: false,
  whatsappAiAgent: false,
  chatbotBasic: false,
  aiUnlimited: false,
  marketplaceEnabled: true,
  marketplaceHighlight: false,
  marketplacePriority: 0,
  features: [],
  planName: "Gratuito",
  planSlug: "gratuito",
  planId: null,
  priceMonthly: 0,
  priceYearly: 0,
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
        maxVideos: plan.max_videos ?? 1,
        maxUsers: (plan as any).max_users ?? 1,
        maxStores: (plan as any).max_stores ?? 1,
        maxWhatsappMessages: plan.max_whatsapp_messages ?? 0,
        whatsappChatbot: plan.whatsapp_chatbot ?? false,
        whatsappAiAgent: plan.whatsapp_ai_agent ?? false,
        chatbotBasic: (plan as any).chatbot_basic ?? false,
        aiUnlimited: plan.ai_unlimited ?? false,
        marketplaceEnabled: (plan as any).marketplace_enabled ?? true,
        marketplaceHighlight: (plan as any).marketplace_highlight ?? false,
        marketplacePriority: (plan as any).marketplace_priority ?? 0,
        features: Array.isArray(plan.features) ? (plan.features as unknown as string[]) : [],
        planName: plan.name,
        planSlug: (plan as any).slug ?? null,
        planId: plan.id,
        priceMonthly: (plan as any).price_monthly ?? plan.price ?? 0,
        priceYearly: (plan as any).price_yearly ?? 0,
      };
    },
    enabled: !!establishmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get establishment addons
  const { data: addons } = useQuery({
    queryKey: ["establishment-addons", establishmentId],
    queryFn: async (): Promise<EstablishmentAddon[]> => {
      if (!establishmentId) return [];

      const { data, error } = await supabase
        .from("establishment_addons")
        .select(`
          id,
          addon_id,
          quantity,
          is_active,
          plan_addons (
            name,
            slug
          )
        `)
        .eq("establishment_id", establishmentId)
        .eq("is_active", true);

      if (error) return [];

      return (data || []).map((item: any) => ({
        id: item.id,
        addon_id: item.addon_id,
        addon_name: item.plan_addons?.name ?? "",
        addon_slug: item.plan_addons?.slug ?? "",
        quantity: item.quantity,
        is_active: item.is_active,
      }));
    },
    enabled: !!establishmentId,
    staleTime: 5 * 60 * 1000,
  });

  // Helper functions
  const isUnlimited = (value: number | null): boolean => {
    return value === null || value === -1;
  };

  const canAddMoreProducts = (currentCount: number): boolean => {
    if (!planFeatures) return true;
    if (isUnlimited(planFeatures.maxProducts)) return true;
    return currentCount < (planFeatures.maxProducts || 0);
  };

  const canAddMoreVideos = (currentCount: number): boolean => {
    if (!planFeatures) return false;
    if (isUnlimited(planFeatures.maxVideos)) return true;
    return currentCount < (planFeatures.maxVideos || 0);
  };

  const canAddMoreUsers = (currentCount: number): boolean => {
    if (!planFeatures) return false;
    const baseLimit = planFeatures.maxUsers || 1;
    const extraUsers = addons?.filter(a => a.addon_slug === "extra-user")
      .reduce((acc, a) => acc + a.quantity, 0) || 0;
    const totalLimit = baseLimit + extraUsers;
    if (isUnlimited(baseLimit)) return true;
    return currentCount < totalLimit;
  };

  const canAddMoreStores = (currentCount: number): boolean => {
    if (!planFeatures) return false;
    const baseLimit = planFeatures.maxStores || 1;
    const extraStores = addons?.filter(a => a.addon_slug === "extra-store")
      .reduce((acc, a) => acc + a.quantity, 0) || 0;
    const totalLimit = baseLimit + extraStores;
    if (isUnlimited(baseLimit)) return true;
    return currentCount < totalLimit;
  };

  const canUseWhatsappChatbot = (): boolean => {
    if (planFeatures?.whatsappChatbot) return true;
    if (planFeatures?.chatbotBasic) return true;
    // Check for AI agent addon
    return addons?.some(a => a.addon_slug === "ai-agent-advanced" && a.is_active) ?? false;
  };

  const canUseWhatsappAI = (): boolean => {
    if (planFeatures?.whatsappAiAgent) return true;
    // Check for AI agent addon
    return addons?.some(a => a.addon_slug === "ai-agent-advanced" && a.is_active) ?? false;
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

  const hasAddon = (addonSlug: string): boolean => {
    return addons?.some(a => a.addon_slug === addonSlug && a.is_active) ?? false;
  };

  const getRemainingQuota = (type: "products" | "videos" | "orders" | "users" | "stores", currentCount: number): number => {
    if (!planFeatures) return 0;
    
    let limit: number | null = null;
    
    switch (type) {
      case "products":
        limit = planFeatures.maxProducts;
        break;
      case "videos":
        limit = planFeatures.maxVideos;
        break;
      case "orders":
        limit = planFeatures.maxOrders;
        break;
      case "users":
        const extraUsers = addons?.filter(a => a.addon_slug === "extra-user")
          .reduce((acc, a) => acc + a.quantity, 0) || 0;
        limit = (planFeatures.maxUsers || 1) + extraUsers;
        break;
      case "stores":
        const extraStores = addons?.filter(a => a.addon_slug === "extra-store")
          .reduce((acc, a) => acc + a.quantity, 0) || 0;
        limit = (planFeatures.maxStores || 1) + extraStores;
        break;
    }
    
    if (isUnlimited(limit)) return Infinity;
    return Math.max(0, (limit || 0) - currentCount);
  };

  const isPlanFree = (): boolean => {
    return planFeatures?.planSlug === "gratuito" || planFeatures?.priceMonthly === 0;
  };

  const getUpgradeSuggestion = (): string | null => {
    if (!planFeatures) return null;
    
    switch (planFeatures.planSlug) {
      case "gratuito":
        return "starter";
      case "starter":
        return "pro";
      case "pro":
        return "business";
      default:
        return null;
    }
  };

  return {
    planFeatures: planFeatures ?? DEFAULT_PLAN,
    addons: addons ?? [],
    isLoading,
    canAddMoreProducts,
    canAddMoreVideos,
    canAddMoreUsers,
    canAddMoreStores,
    canUseWhatsappChatbot,
    canUseWhatsappAI,
    canUseAI,
    hasFeature,
    hasAddon,
    getRemainingQuota,
    isPlanFree,
    getUpgradeSuggestion,
    isUnlimited,
  };
};
