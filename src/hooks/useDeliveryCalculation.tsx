import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from './useGeolocation';

interface DeliveryResult {
  success: boolean;
  can_deliver: boolean;
  distance_km: number;
  delivery_fee: number;
  estimated_min_time: number;
  estimated_max_time: number;
  zone_name: string | null;
  establishment_name: string;
  max_radius_km: number;
  message: string;
  error?: string;
}

interface UseDeliveryCalculationOptions {
  establishment_id: string;
}

export const useDeliveryCalculation = ({ establishment_id }: UseDeliveryCalculationOptions) => {
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDelivery = useCallback(async (
    customerLat: number,
    customerLng: number,
    customerCep?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-delivery', {
        body: {
          establishment_id,
          customer_lat: customerLat,
          customer_lng: customerLng,
          customer_cep: customerCep,
        },
      });

      if (fnError) throw fnError;

      setResult(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao calcular entrega';
      setError(errorMsg);
      return { success: false, can_deliver: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [establishment_id]);

  // Simple local calculation (fallback)
  const calculateLocal = useCallback(async (
    customerLat: number,
    customerLng: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Get establishment data
      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .select('id, name, latitude, longitude, max_delivery_radius_km, delivery_base_fee, delivery_fee_per_km')
        .eq('id', establishment_id)
        .single();

      if (estError || !establishment) {
        throw new Error('Estabelecimento não encontrado');
      }

      if (!establishment.latitude || !establishment.longitude) {
        throw new Error('Estabelecimento sem localização configurada');
      }

      const distance = calculateDistance(
        establishment.latitude,
        establishment.longitude,
        customerLat,
        customerLng
      );

      const maxRadius = establishment.max_delivery_radius_km || 10;
      const canDeliver = distance <= maxRadius;

      const baseFee = establishment.delivery_base_fee || 5;
      const feePerKm = establishment.delivery_fee_per_km || 1.5;
      const deliveryFee = Math.round((baseFee + (distance * feePerKm)) * 100) / 100;

      const baseTime = 15;
      const timePerKm = 3;
      const estimatedMinTime = Math.round(baseTime + (distance * timePerKm * 0.8));
      const estimatedMaxTime = Math.round(baseTime + (distance * timePerKm * 1.2));

      const result: DeliveryResult = {
        success: true,
        can_deliver: canDeliver,
        distance_km: Math.round(distance * 100) / 100,
        delivery_fee: deliveryFee,
        estimated_min_time: estimatedMinTime,
        estimated_max_time: estimatedMaxTime,
        zone_name: null,
        establishment_name: establishment.name,
        max_radius_km: maxRadius,
        message: canDeliver
          ? `Entrega disponível! Taxa: R$ ${deliveryFee.toFixed(2)}`
          : `Fora da área de entrega (distância: ${distance.toFixed(1)} km, máximo: ${maxRadius} km)`,
      };

      setResult(result);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao calcular entrega';
      setError(errorMsg);
      return { success: false, can_deliver: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [establishment_id]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    loading,
    error,
    calculateDelivery,
    calculateLocal,
    reset,
  };
};
