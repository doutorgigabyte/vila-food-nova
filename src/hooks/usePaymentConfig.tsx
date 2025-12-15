import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentMethodsConfig {
  pix: boolean;
  credit_card: boolean;
  debit_card: boolean;
  cash: boolean;
  card_on_delivery: boolean;
  pix_on_delivery: boolean;
}

const DEFAULT_CONFIG: PaymentMethodsConfig = {
  pix: true,
  credit_card: true,
  debit_card: true,
  cash: true,
  card_on_delivery: false,
  pix_on_delivery: false,
};

export function usePaymentConfig(establishmentId: string | null) {
  const [config, setConfig] = useState<PaymentMethodsConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (establishmentId) {
      fetchConfig();
    }
  }, [establishmentId]);

  const fetchConfig = async () => {
    if (!establishmentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('payment_methods_config, mercado_pago_token')
        .eq('id', establishmentId)
        .single();

      if (error) throw error;

      if (data.payment_methods_config) {
        const dbConfig = data.payment_methods_config as unknown as PaymentMethodsConfig;
        setConfig({ ...DEFAULT_CONFIG, ...dbConfig });
      }
      setIsConnected(!!data.mercado_pago_token);
    } catch (error) {
      console.error('Error fetching payment config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: Partial<PaymentMethodsConfig>) => {
    if (!establishmentId) return;

    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('establishments')
        .update({
          payment_methods_config: updatedConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', establishmentId);

      if (error) throw error;
      toast.success('Configuração salva!');
    } catch (error) {
      console.error('Error saving payment config:', error);
      toast.error('Erro ao salvar configuração');
      // Revert on error
      fetchConfig();
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    loading,
    saving,
    isConnected,
    updateConfig,
    refetch: fetchConfig,
  };
}
