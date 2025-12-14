import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveRegion {
  city_name: string;
  city_id?: string;
  state: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  bias_radius_meters: number;
}

export interface ServiceCity {
  id: string;
  name: string;
  slug: string;
  state_name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
}

const DEFAULT_REGION: ActiveRegion = {
  city_name: "Tamandaré",
  state: "PE",
  center_lat: -8.7576,
  center_lng: -35.1031,
  radius_km: 30,
  bias_radius_meters: 30000,
};

export const useActiveRegion = () => {
  const [region, setRegion] = useState<ActiveRegion>(DEFAULT_REGION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegion = async () => {
      try {
        const { data, error } = await supabase.rpc('get_active_region');
        
        if (error) {
          console.error("Error fetching active region:", error);
          return;
        }

        if (data && typeof data === 'object') {
          const regionData = data as Record<string, unknown>;
          setRegion({
            city_name: String(regionData.city_name || DEFAULT_REGION.city_name),
            city_id: regionData.city_id ? String(regionData.city_id) : undefined,
            state: String(regionData.state || DEFAULT_REGION.state),
            center_lat: Number(regionData.center_lat || DEFAULT_REGION.center_lat),
            center_lng: Number(regionData.center_lng || DEFAULT_REGION.center_lng),
            radius_km: Number(regionData.radius_km || DEFAULT_REGION.radius_km),
            bias_radius_meters: Number(regionData.bias_radius_meters || DEFAULT_REGION.bias_radius_meters),
          });
        }
      } catch (error) {
        console.error("Error fetching active region:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegion();
  }, []);

  return { region, loading };
};

export const useServiceCities = () => {
  const [cities, setCities] = useState<ServiceCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase.rpc('get_service_cities');
        
        if (error) {
          console.error("Error fetching service cities:", error);
          return;
        }

        if (data && Array.isArray(data)) {
          setCities(data.map((city: Record<string, unknown>) => ({
            id: String(city.id || ''),
            name: String(city.name || ''),
            slug: String(city.slug || ''),
            state_name: String(city.state_name || ''),
            center_lat: Number(city.center_lat || 0),
            center_lng: Number(city.center_lng || 0),
            radius_km: Number(city.radius_km || 30),
          })));
        }
      } catch (error) {
        console.error("Error fetching service cities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  return { cities, loading };
};

// Utility function to check if coordinates are within a service city
export const isWithinServiceArea = (
  lat: number, 
  lng: number, 
  city: ServiceCity
): boolean => {
  if (!city.center_lat || !city.center_lng || !city.radius_km) return false;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat - city.center_lat) * Math.PI / 180;
  const dLng = (lng - city.center_lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(city.center_lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= city.radius_km;
};

// Validate if a city name matches any service city
export const validateServiceCity = (
  cityName: string,
  serviceCities: ServiceCity[]
): ServiceCity | null => {
  if (!cityName || !serviceCities.length) return null;
  
  const normalizedInput = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return serviceCities.find(city => {
    const normalizedCity = city.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedCity === normalizedInput || normalizedCity.includes(normalizedInput) || normalizedInput.includes(normalizedCity);
  }) || null;
};
