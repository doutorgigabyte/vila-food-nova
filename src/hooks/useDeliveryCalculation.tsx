import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from './useGeolocation';

interface DeliveryResult {
  success: boolean;
  can_deliver: boolean;
  distance_km: number;
  
  // Standard delivery
  standard_fee: number;
  standard_available: boolean;
  standard_time: {
    min: number;
    max: number;
  };
  
  // Turbo delivery
  turbo_fee: number;
  turbo_available: boolean;
  turbo_time: {
    min: number;
    max: number;
  };
  
  // Zone info
  is_free_zone: boolean;
  is_minimum_zone: boolean;
  matched_zone: string | null;
  matched_turbo_zone: string | null;
  
  // Legacy fields
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
      // Get establishment data with new fields
      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .select(`
          id, name, latitude, longitude, 
          max_delivery_radius_km, delivery_base_fee, delivery_fee_per_km,
          free_delivery_radius_km, minimum_delivery_fee, minimum_delivery_radius_km,
          turbo_fee, turbo_radius_km, delivery_calculation_mode
        `)
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

      // Configuration values
      const freeRadius = establishment.free_delivery_radius_km || 0;
      const minFeeRadius = establishment.minimum_delivery_radius_km || 1;
      const minFee = establishment.minimum_delivery_fee || 5;
      const baseFee = establishment.delivery_base_fee || 5;
      const feePerKm = establishment.delivery_fee_per_km || 1.5;
      const turboFeeValue = establishment.turbo_fee || 15;
      const turboRadius = establishment.turbo_radius_km || 15;
      const maxRadius = establishment.max_delivery_radius_km || 10;

      // Calculate standard fee
      let standardFee = 0;
      let isFreeZone = false;
      let isMinimumZone = false;
      let canDeliverStandard = false;

      // Check free zone
      if (freeRadius > 0 && distance <= freeRadius) {
        isFreeZone = true;
        standardFee = 0;
        canDeliverStandard = true;
      }
      // Check minimum fee zone
      else if (minFeeRadius > 0 && distance <= minFeeRadius) {
        isMinimumZone = true;
        standardFee = minFee;
        canDeliverStandard = true;
      }
      // Check standard zone
      else if (distance <= maxRadius) {
        standardFee = baseFee + (distance * feePerKm);
        canDeliverStandard = true;
      }

      // Turbo availability
      const canDeliverTurbo = distance <= turboRadius || canDeliverStandard;

      // Round fees
      standardFee = Math.round(standardFee * 100) / 100;

      // Time estimates
      const baseTime = 15;
      const timePerKm = 3;
      const estimatedMinTime = Math.round(baseTime + (distance * timePerKm * 0.8));
      const estimatedMaxTime = Math.round(baseTime + (distance * timePerKm * 1.2));

      const result: DeliveryResult = {
        success: true,
        can_deliver: canDeliverStandard || canDeliverTurbo,
        distance_km: Math.round(distance * 100) / 100,
        
        standard_fee: standardFee,
        standard_available: canDeliverStandard,
        standard_time: {
          min: estimatedMinTime,
          max: estimatedMaxTime
        },
        
        turbo_fee: turboFeeValue,
        turbo_available: canDeliverTurbo,
        turbo_time: {
          min: 10,
          max: 20
        },
        
        is_free_zone: isFreeZone,
        is_minimum_zone: isMinimumZone,
        matched_zone: null,
        matched_turbo_zone: null,
        
        delivery_fee: standardFee,
        estimated_min_time: estimatedMinTime,
        estimated_max_time: estimatedMaxTime,
        zone_name: null,
        establishment_name: establishment.name,
        max_radius_km: maxRadius,
        message: canDeliverStandard
          ? isFreeZone 
            ? "Entrega grátis para sua região!"
            : `Entrega disponível! Taxa: R$ ${standardFee.toFixed(2)}`
          : canDeliverTurbo
            ? `Apenas Turbo disponível! Taxa: R$ ${turboFeeValue.toFixed(2)}`
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
