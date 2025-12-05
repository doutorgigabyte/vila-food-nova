/**
 * usePayments - Hook para gerenciamento de pagamentos
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PaymentGateway, createPaymentGateway } from '@/lib/payment';
import type { PaymentStatus, PaymentMethod, GatewayProvider } from '@/lib/payment';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  establishment_id: string;
  type: 'sale' | 'subscription' | 'refund';
  status: string;
  amount: number;
  platform_fee: number | null;
  net_amount: number | null;
  mp_payment_id: string | null;
  mp_preapproval_id: string | null;
  payer_email: string | null;
  payer_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentStats {
  totalSales: number;
  totalPending: number;
  totalApproved: number;
  totalRefunded: number;
  transactionCount: number;
  averageTicket: number;
}

interface UsePaymentsOptions {
  establishmentId?: string;
  autoFetch?: boolean;
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const { establishmentId, autoFetch = true } = options;
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalSales: 0,
    totalPending: 0,
    totalApproved: 0,
    totalRefunded: 0,
    transactionCount: 0,
    averageTicket: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions
  const fetchTransactions = useCallback(async (estId?: string) => {
    const targetId = estId || establishmentId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('mp_transactions')
        .select('*')
        .eq('establishment_id', targetId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      const transactionData = (data || []) as Transaction[];
      setTransactions(transactionData);

      // Calculate stats
      const approved = transactionData.filter(t => t.status === 'approved' && t.type === 'sale');
      const pending = transactionData.filter(t => t.status === 'pending' && t.type === 'sale');
      const refunded = transactionData.filter(t => t.type === 'refund');

      const totalApproved = approved.reduce((sum, t) => sum + (t.net_amount || t.amount), 0);
      const totalPending = pending.reduce((sum, t) => sum + t.amount, 0);
      const totalRefunded = Math.abs(refunded.reduce((sum, t) => sum + t.amount, 0));

      setStats({
        totalSales: totalApproved + totalPending,
        totalPending,
        totalApproved,
        totalRefunded,
        transactionCount: transactionData.filter(t => t.type === 'sale').length,
        averageTicket: approved.length > 0 ? totalApproved / approved.length : 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar transações';
      setError(message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  // Create payment
  const createPayment = useCallback(async (
    orderId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    payerEmail: string,
    payerName?: string,
    estId?: string
  ) => {
    const targetId = estId || establishmentId;
    if (!targetId) {
      toast.error('Estabelecimento não definido');
      return null;
    }

    try {
      const gateway = createPaymentGateway(targetId);

      if (paymentMethod === 'pix') {
        const result = await gateway.createPixPayment(
          orderId,
          amount,
          `Pedido #${orderId.slice(-8)}`,
          { email: payerEmail, name: payerName }
        );
        return result;
      }

      // For other methods
      const result = await gateway.createPayment({
        order_id: orderId,
        establishment_id: targetId,
        amount,
        description: `Pedido #${orderId.slice(-8)}`,
        payment_method: paymentMethod,
        payer: { email: payerEmail, name: payerName },
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar pagamento';
      toast.error(message);
      return null;
    }
  }, [establishmentId]);

  // Check payment status
  const checkPaymentStatus = useCallback(async (paymentId: string, estId?: string) => {
    const targetId = estId || establishmentId;
    if (!targetId) return null;

    try {
      const gateway = createPaymentGateway(targetId);
      return await gateway.getPayment(paymentId);
    } catch (err) {
      console.error('Error checking payment:', err);
      return null;
    }
  }, [establishmentId]);

  // Process refund
  const processRefund = useCallback(async (paymentId: string, estId?: string) => {
    const targetId = estId || establishmentId;
    if (!targetId) {
      toast.error('Estabelecimento não definido');
      return null;
    }

    try {
      const gateway = createPaymentGateway(targetId);
      const result = await gateway.refund({
        payment_id: paymentId,
        establishment_id: targetId,
      });

      if (result.success) {
        toast.success('Estorno realizado com sucesso');
        fetchTransactions(targetId);
      } else {
        toast.error(result.error || 'Erro ao estornar');
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao estornar';
      toast.error(message);
      return null;
    }
  }, [establishmentId, fetchTransactions]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && establishmentId) {
      fetchTransactions();
    }
  }, [autoFetch, establishmentId, fetchTransactions]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!establishmentId) return;

    const channel = supabase
      .channel(`transactions-${establishmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mp_transactions',
          filter: `establishment_id=eq.${establishmentId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, fetchTransactions]);

  return {
    transactions,
    stats,
    loading,
    error,
    fetchTransactions,
    createPayment,
    checkPaymentStatus,
    processRefund,
    // Helper functions
    getStatusLabel: PaymentGateway.getStatusLabel,
    getStatusColor: PaymentGateway.getStatusColor,
    getMethodLabel: PaymentGateway.getMethodLabel,
  };
}
