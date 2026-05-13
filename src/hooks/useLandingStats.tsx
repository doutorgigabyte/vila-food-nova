import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandingStats {
  activeEstablishments: number;
  ordersLast30Days: number;
  /** Threshold abaixo do qual nao mostramos numero — fica copy honesto. */
  isEarlyStage: boolean;
}

const EARLY_STAGE_THRESHOLD = 5;

/**
 * Estatisticas agregadas para mostrar como social proof na landing.
 * Quando os numeros sao baixos demais (early stage), o componente
 * consumidor mostra copy honesto ao inves de numeros pequenos que
 * passariam falta de credibilidade.
 *
 * Ambas as queries falham silenciosamente: se as tabelas estao sem RLS
 * publica ou indisponiveis, retorna 0 e a UI vai pro fallback.
 */
export const useLandingStats = () => {
  return useQuery({
    queryKey: ["landing-stats"],
    queryFn: async (): Promise<LandingStats> => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const [establishmentsRes, ordersRes] = await Promise.all([
        supabase
          .from("establishments")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since.toISOString()),
      ]);

      const activeEstablishments = establishmentsRes.count ?? 0;
      const ordersLast30Days = ordersRes.count ?? 0;

      return {
        activeEstablishments,
        ordersLast30Days,
        isEarlyStage: activeEstablishments < EARLY_STAGE_THRESHOLD,
      };
    },
    staleTime: 10 * 60 * 1000, // 10min — contadores nao precisam ser real-time
  });
};
