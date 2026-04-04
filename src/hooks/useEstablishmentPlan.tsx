import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  price: number;
  max_products: number | null;
  max_orders: number | null;
  max_videos: number | null;
  max_whatsapp_messages: number | null;
  whatsapp_chatbot: boolean | null;
  whatsapp_ai_agent: boolean | null;
  ai_unlimited: boolean | null;
  features: string[] | null;
}

interface PlanUsage {
  currentProducts: number;
  currentVideos: number;
}

interface EstablishmentPlanData {
  plan: Plan | null;
  usage: PlanUsage;
  loading: boolean;
  canAddProduct: boolean;
  canAddVideo: boolean;
  hasWhatsAppChatbot: boolean;
  hasWhatsAppAIAgent: boolean;
  hasAIUnlimited: boolean;
  productLimitReached: boolean;
  videoLimitReached: boolean;
}

export function useEstablishmentPlan(establishmentId: string | null): EstablishmentPlanData {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<PlanUsage>({ currentProducts: 0, currentVideos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!establishmentId) {
      setLoading(false);
      return;
    }

    const fetchPlanData = async () => {
      try {
        // Fetch establishment with plan
        const { data: est } = await supabase
          .from("establishments")
          .select("plan_id")
          .eq("id", establishmentId)
          .single();

        if (est?.plan_id) {
          const { data: planData } = await supabase
            .from("plans")
            .select("*")
            .eq("id", est.plan_id)
            .single();

          setPlan(planData as Plan | null);
        }

        // Fetch usage counts
        const { count: productCount } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("establishment_id", establishmentId)
          .eq("is_active", true);

        const { count: videoCount } = await supabase
          .from("establishment_videos")
          .select("id", { count: "exact", head: true })
          .eq("establishment_id", establishmentId)
          .eq("is_active", true);

        setUsage({
          currentProducts: productCount || 0,
          currentVideos: videoCount || 0,
        });
      } catch (error) {
        console.error("Error fetching plan data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [establishmentId]);

  const maxProducts = plan?.max_products ?? Infinity;
  const maxVideos = plan?.max_videos ?? Infinity;
  const productLimitReached = usage.currentProducts >= maxProducts;
  const videoLimitReached = usage.currentVideos >= maxVideos;

  return {
    plan,
    usage,
    loading,
    canAddProduct: !productLimitReached,
    canAddVideo: !videoLimitReached,
    hasWhatsAppChatbot: plan?.whatsapp_chatbot ?? false,
    hasWhatsAppAIAgent: plan?.whatsapp_ai_agent ?? false,
    hasAIUnlimited: plan?.ai_unlimited ?? false,
    productLimitReached,
    videoLimitReached,
  };
}
