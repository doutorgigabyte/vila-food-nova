import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SplitItem {
  establishment_id: string;
  order_id: string;
  amount: number;
}

interface MultiSplitPaymentResult {
  success: boolean;
  split_id?: string;
  payment_id?: string;
  status?: string;
  qr_code?: string;
  qr_code_base64?: string;
  expiration?: string;
  total_amount?: number;
  platform_fee?: number;
  items?: Array<{
    establishment_id: string;
    amount: number;
    net_amount: number;
  }>;
  error?: string;
}

interface PaymentStatusResult {
  success: boolean;
  status?: string;
  mp_status?: string;
  split_id?: string;
  error?: string;
}

export function useMultiSplitPayment() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const createMultiSplitPayment = async (
    checkoutId: string,
    totalAmount: number,
    items: SplitItem[],
    payerEmail?: string,
    payerName?: string,
    description?: string
  ): Promise<MultiSplitPaymentResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-multi-split', {
        body: {
          action: 'create_payment',
          checkout_id: checkoutId,
          total_amount: totalAmount,
          items,
          payer_email: payerEmail,
          payer_name: payerName,
          description,
        },
      });

      if (error) throw error;
      
      return data as MultiSplitPaymentResult;
    } catch (error: any) {
      console.error('Multi-split payment error:', error);
      toast.error('Erro ao criar pagamento multi-loja');
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (checkoutId: string): Promise<PaymentStatusResult> => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-multi-split', {
        body: {
          action: 'check_status',
          checkout_id: checkoutId,
        },
      });

      if (error) throw error;
      
      return data as PaymentStatusResult;
    } catch (error: any) {
      console.error('Check status error:', error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setChecking(false);
    }
  };

  return {
    createMultiSplitPayment,
    checkPaymentStatus,
    loading,
    checking,
  };
}
