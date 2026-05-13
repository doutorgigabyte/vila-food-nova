import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompetitorFee {
  id: string;
  competitor_slug: string;
  competitor_name: string;
  plan_slug: string;
  plan_label: string;
  commission_percent: number;       // fracao decimal (0.12 = 12%)
  payment_fee_percent: number;
  monthly_fee: number;
  monthly_fee_threshold: number;
  source_url: string | null;
  effective_from: string | null;
  notes: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// Fallback usado quando a tabela `competitor_fees` esta vazia ou
// indisponivel. Mantem os mesmos valores que estavam hardcoded no
// IFoodCalculator antes da Fase 3.
const FALLBACK_IFOOD_FEES: CompetitorFee[] = [
  {
    id: "fallback-ifood-basico",
    competitor_slug: "ifood",
    competitor_name: "iFood",
    plan_slug: "basico-propria",
    plan_label: "Plano Básico (Meus Motoboys)",
    commission_percent: 0.12,
    payment_fee_percent: 0.032,
    monthly_fee: 100,
    monthly_fee_threshold: 1800,
    source_url: "https://institucional.ifood.com.br/parceiros/precos/",
    effective_from: "2026-01-01",
    notes: null,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-ifood-entrega",
    competitor_slug: "ifood",
    competitor_name: "iFood",
    plan_slug: "entrega-ifood",
    plan_label: "Plano Entrega (Parceiro iFood)",
    commission_percent: 0.23,
    payment_fee_percent: 0.032,
    monthly_fee: 130,
    monthly_fee_threshold: 1800,
    source_url: "https://institucional.ifood.com.br/parceiros/precos/",
    effective_from: "2026-01-01",
    notes: null,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
];

/**
 * Lista taxas de competidores ativas. Quando o DB esta vazio ou erro,
 * cai pros valores hardcoded (mesmos que estavam no calculator antes).
 *
 * Filtra por `competitorSlug` se passado (default: 'ifood').
 */
export const useCompetitorFees = (competitorSlug = "ifood"): CompetitorFee[] => {
  const { data } = useQuery({
    queryKey: ["competitor-fees", competitorSlug],
    queryFn: async (): Promise<CompetitorFee[]> => {
      const { data, error } = await supabase
        .from("competitor_fees")
        .select("*")
        .eq("is_active", true)
        .eq("competitor_slug", competitorSlug)
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("[useCompetitorFees] query failed, using fallback:", error.message);
        return [];
      }
      return ((data ?? []) as unknown as CompetitorFee[]).map((r) => ({
        ...r,
        // Postgres numeric volta como string em alguns casos — normaliza
        commission_percent: Number(r.commission_percent),
        payment_fee_percent: Number(r.payment_fee_percent),
        monthly_fee: Number(r.monthly_fee),
        monthly_fee_threshold: Number(r.monthly_fee_threshold),
      }));
    },
    staleTime: 30 * 60 * 1000,
  });

  if (!data || data.length === 0) {
    return FALLBACK_IFOOD_FEES.filter((f) => f.competitor_slug === competitorSlug);
  }
  return data;
};

export const useAllCompetitorFeesAdmin = () => {
  return useQuery({
    queryKey: ["competitor-fees", "admin"],
    queryFn: async (): Promise<CompetitorFee[]> => {
      const { data, error } = await supabase
        .from("competitor_fees")
        .select("*")
        .order("competitor_slug", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return ((data ?? []) as unknown as CompetitorFee[]).map((r) => ({
        ...r,
        commission_percent: Number(r.commission_percent),
        payment_fee_percent: Number(r.payment_fee_percent),
        monthly_fee: Number(r.monthly_fee),
        monthly_fee_threshold: Number(r.monthly_fee_threshold),
      }));
    },
  });
};
