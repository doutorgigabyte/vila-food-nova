import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Segment {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean;
}

export const useSegments = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const { data, error } = await supabase
          .from("segments")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (error) throw error;
        setSegments(data || []);
      } catch (error) {
        console.error("Error fetching segments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSegments();
  }, []);

  return { segments, loading };
};
