import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VilaEntryPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface Vila {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  address: string | null;
  neighborhood: string | null;
  city_id: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  has_wayfinding: boolean;
  default_entry_point: VilaEntryPoint | null;
}

export const useVilas = () => {
  const [vilas, setVilas] = useState<Vila[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVilas = async () => {
      const { data, error } = await supabase
        .from('vilas')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setVilas(data as Vila[]);
      }
      setLoading(false);
    };

    fetchVilas();
  }, []);

  return { vilas, loading };
};

export interface VilaEstablishment {
  id: string;
  vila_id: string | null;
  name: string;
  slug: string;
  banner_url: string | null;
  logo_url: string | null;
  is_open: boolean | null;
  accepts_pickup: boolean | null;
  avg_delivery_time: number | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export const useVila = (slug: string) => {
  const [vila, setVila] = useState<Vila | null>(null);
  const [establishments, setEstablishments] = useState<VilaEstablishment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVila = async () => {
      if (!slug) return;

      // Fetch vila
      const { data: vilaData, error: vilaError } = await supabase
        .from('vilas')
        .select('*')
        .eq('slug', slug)
        .single();

      if (vilaError || !vilaData) {
        setLoading(false);
        return;
      }

      setVila(vilaData as Vila);

      // Fetch establishments in this vila
      const { data: estData } = await supabase
        .from('establishments')
        .select('*')
        .eq('vila_id', vilaData.id)
        .eq('status', 'active')
        .order('name');

      setEstablishments((estData || []) as VilaEstablishment[]);
      setLoading(false);
    };

    fetchVila();
  }, [slug]);

  return { vila, establishments, loading };
};
