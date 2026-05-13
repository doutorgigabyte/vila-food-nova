import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { faqCategories as fallbackFAQ, type FAQCategory } from "@/components/landing/faqData";

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Busca FAQ ativos do DB e agrupa por categoria preservando a ordem
 * de insercao da primeira ocorrencia de cada categoria. Quando o DB
 * estiver vazio (antes de marketing curar via /admin/faq), cai pro
 * fallback hardcoded em faqData.ts.
 *
 * Retorna sempre um array de FAQCategory, nunca undefined — assim os
 * componentes consumidores nao precisam tratar loading/empty.
 */
export const useFAQItems = (): FAQCategory[] => {
  const { data } = useQuery({
    queryKey: ["faq-items", "public"],
    queryFn: async (): Promise<FAQItem[]> => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("[useFAQItems] query failed, using fallback:", error.message);
        return [];
      }
      return (data ?? []) as FAQItem[];
    },
    staleTime: 10 * 60 * 1000, // FAQ muda raro
  });

  if (!data || data.length === 0) {
    return fallbackFAQ;
  }

  // Agrupa por categoria preservando a ordem de aparicao
  const seen = new Set<string>();
  const order: string[] = [];
  for (const item of data) {
    if (!seen.has(item.category)) {
      seen.add(item.category);
      order.push(item.category);
    }
  }

  return order.map((category) => ({
    title: category,
    questions: data
      .filter((i) => i.category === category)
      .map((i) => ({ question: i.question, answer: i.answer })),
  }));
};

/**
 * Versao admin: retorna inclusive itens inativos.
 */
export const useAllFAQItemsAdmin = () => {
  return useQuery({
    queryKey: ["faq-items", "admin"],
    queryFn: async (): Promise<FAQItem[]> => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as FAQItem[];
    },
  });
};
