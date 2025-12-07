import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DeliveryConfig {
  id?: string;
  establishment_id: string;
  calculation_method: 'zone' | 'km';
  base_fee: number;
  fee_per_km: number;
  driver_commission_type: 'percentage' | 'fixed';
  driver_commission_value: number;
  auto_payout: boolean;
  payout_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  min_payout_amount: number;
}

const DEFAULT_CONFIG: Omit<DeliveryConfig, 'establishment_id'> = {
  calculation_method: 'zone',
  base_fee: 5.00,
  fee_per_km: 1.50,
  driver_commission_type: 'percentage',
  driver_commission_value: 70,
  auto_payout: false,
  payout_frequency: 'weekly',
  min_payout_amount: 50,
};

interface RawDeliveryConfig {
  id: string;
  establishment_id: string;
  calculation_method: string | null;
  base_fee: number | null;
  fee_per_km: number | null;
  driver_commission_type: string | null;
  driver_commission_value: number | null;
  auto_payout: boolean | null;
  payout_frequency: string | null;
  min_payout_amount: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useDeliveryConfig = (establishmentId: string | null) => {
  const [config, setConfig] = useState<DeliveryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!establishmentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('establishment_delivery_config' as any)
        .select('*')
        .eq('establishment_id', establishmentId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const rawData = data as unknown as RawDeliveryConfig;
        setConfig({
          id: rawData.id,
          establishment_id: rawData.establishment_id,
          calculation_method: (rawData.calculation_method || 'zone') as 'zone' | 'km',
          base_fee: rawData.base_fee || 5,
          fee_per_km: rawData.fee_per_km || 1.5,
          driver_commission_type: (rawData.driver_commission_type || 'percentage') as 'percentage' | 'fixed',
          driver_commission_value: rawData.driver_commission_value || 70,
          auto_payout: rawData.auto_payout || false,
          payout_frequency: (rawData.payout_frequency || 'weekly') as 'daily' | 'weekly' | 'biweekly' | 'monthly',
          min_payout_amount: rawData.min_payout_amount || 50,
        });
      } else {
        // Return default config for new establishments
        setConfig({
          ...DEFAULT_CONFIG,
          establishment_id: establishmentId,
        });
      }
    } catch (error) {
      console.error('Error fetching delivery config:', error);
      // Set default config on error
      setConfig({
        ...DEFAULT_CONFIG,
        establishment_id: establishmentId,
      });
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = useCallback(async (updates: Partial<DeliveryConfig>) => {
    if (!establishmentId || !config) return;

    setSaving(true);
    try {
      const updatedConfig = { ...config, ...updates };
      
      const { error } = await supabase
        .from('establishment_delivery_config' as any)
        .upsert({
          id: config.id,
          establishment_id: establishmentId,
          calculation_method: updatedConfig.calculation_method,
          base_fee: updatedConfig.base_fee,
          fee_per_km: updatedConfig.fee_per_km,
          driver_commission_type: updatedConfig.driver_commission_type,
          driver_commission_value: updatedConfig.driver_commission_value,
          auto_payout: updatedConfig.auto_payout,
          payout_frequency: updatedConfig.payout_frequency,
          min_payout_amount: updatedConfig.min_payout_amount,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'establishment_id',
        });

      if (error) throw error;

      setConfig(updatedConfig);
      toast.success('Configurações de entrega salvas');
    } catch (error) {
      console.error('Error saving delivery config:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }, [establishmentId, config]);

  // Calculate driver earnings based on config
  const calculateDriverEarnings = useCallback((deliveryFee: number): number => {
    if (!config) return 0;

    if (config.driver_commission_type === 'percentage') {
      return (deliveryFee * config.driver_commission_value) / 100;
    } else {
      return Math.min(config.driver_commission_value, deliveryFee);
    }
  }, [config]);

  return {
    config,
    loading,
    saving,
    saveConfig,
    calculateDriverEarnings,
    refetch: fetchConfig,
  };
};
