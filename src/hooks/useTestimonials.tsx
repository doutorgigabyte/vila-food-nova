import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  content: string;
  rating: number;
  avatar_url: string | null;
  establishment_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  metric_label: string | null;
  metric_value: string | null;
  created_at: string;
}

/**
 * Lista os depoimentos ativos para a landing /conheca.
 * Ordem: featured primeiro, depois por sort_order, depois mais novos.
 */
export const useTestimonials = (limit = 6) => {
  return useQuery({
    queryKey: ["testimonials", "public", limit],
    queryFn: async (): Promise<Testimonial[]> => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        // Tabela pode nao existir ainda em ambientes que nao rodaram a migration —
        // nao quebra a landing, apenas log e retorna []. O componente cai pro
        // fallback hardcoded.
        console.warn("[useTestimonials] query failed, falling back:", error.message);
        return [];
      }

      return (data ?? []) as Testimonial[];
    },
    staleTime: 5 * 60 * 1000, // 5min — landing nao muda toda hora
  });
};

/**
 * Versao admin: retorna inclusive depoimentos inativos para gestao em
 * /admin/depoimentos. Requer role super_admin (RLS).
 */
export const useAllTestimonialsAdmin = () => {
  return useQuery({
    queryKey: ["testimonials", "admin"],
    queryFn: async (): Promise<Testimonial[]> => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Testimonial[];
    },
  });
};
