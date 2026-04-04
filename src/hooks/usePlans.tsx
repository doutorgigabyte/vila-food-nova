import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  price_monthly: number | null;
  price_yearly: number | null;
  billing_period: string | null;
  max_products: number | null;
  max_orders: number | null;
  max_videos: number | null;
  max_users: number | null;
  max_stores: number | null;
  max_whatsapp_messages: number | null;
  whatsapp_chatbot: boolean | null;
  whatsapp_ai_agent: boolean | null;
  ai_unlimited: boolean | null;
  marketplace_enabled: boolean | null;
  marketplace_highlight: boolean | null;
  marketplace_priority: number | null;
  chatbot_basic: boolean | null;
  is_popular: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  features: string[] | null;
  created_at: string | null;
}

export interface PlanAddon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  is_active: boolean | null;
  created_at: string | null;
}

export const usePlans = () => {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as unknown as Plan[];
    },
  });
};

export const usePlanAddons = () => {
  return useQuery({
    queryKey: ["plan-addons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_addons")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data as PlanAddon[];
    },
  });
};

export const usePlanBySlug = (slug: string | null) => {
  return useQuery({
    queryKey: ["plan", slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as unknown as Plan;
    },
    enabled: !!slug,
  });
};

// Helper para calcular preço anual com desconto
export const getYearlyPrice = (monthlyPrice: number): number => {
  return Number((monthlyPrice * 12 * 0.8).toFixed(2)); // 20% desconto
};

// Helper para calcular economia anual
export const getYearlySavings = (monthlyPrice: number): number => {
  return Number((monthlyPrice * 12 * 0.2).toFixed(2));
};
