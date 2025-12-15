import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Segment {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean;
  parent_category_id: string | null;
}

export const useSegments = (parentCategoryId?: string | null) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        let query = supabase
          .from("segments")
          .select("id, name, icon, is_active, parent_category_id")
          .eq("is_active", true)
          .order("name");

        if (parentCategoryId) {
          query = query.eq("parent_category_id", parentCategoryId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setSegments(data || []);
      } catch (error) {
        console.error("Error fetching segments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSegments();
  }, [parentCategoryId]);

  return { segments, loading };
};

// Hook to get establishment's main category
export const useEstablishmentMainCategory = (establishmentId: string) => {
  const [mainCategoryId, setMainCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMainCategory = async () => {
      try {
        // Get establishment's segment_id
        const { data: establishment, error: estError } = await supabase
          .from("establishments")
          .select("segment_id")
          .eq("id", establishmentId)
          .single();

        if (estError) throw estError;

        if (establishment?.segment_id) {
          // Get the segment's parent_category_id
          const { data: segment, error: segError } = await supabase
            .from("segments")
            .select("parent_category_id")
            .eq("id", establishment.segment_id)
            .single();

          if (segError) throw segError;
          setMainCategoryId(segment?.parent_category_id || null);
        }
      } catch (error) {
        console.error("Error fetching main category:", error);
      } finally {
        setLoading(false);
      }
    };

    if (establishmentId) {
      fetchMainCategory();
    }
  }, [establishmentId]);

  return { mainCategoryId, loading };
};
