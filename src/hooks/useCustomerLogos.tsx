import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerLogo {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
}

/**
 * Logos dos primeiros estabelecimentos ativos com logo cadastrada,
 * para o carrossel "Quem ja confia no VilaFood" na landing.
 *
 * Ordena por created_at asc para destacar early adopters.
 */
export const useCustomerLogos = (limit = 20) => {
  return useQuery({
    queryKey: ["customer-logos", limit],
    queryFn: async (): Promise<CustomerLogo[]> => {
      const { data, error } = await supabase
        .from("establishments")
        .select("id, name, slug, logo_url")
        .eq("status", "active")
        .not("logo_url", "is", null)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) {
        console.warn("[useCustomerLogos] query failed:", error.message);
        return [];
      }

      // Garante que logo_url nao e string vazia
      return ((data ?? []) as CustomerLogo[]).filter(
        (e) => e.logo_url && e.logo_url.trim().length > 0
      );
    },
    staleTime: 30 * 60 * 1000, // 30min
  });
};
