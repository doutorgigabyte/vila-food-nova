/**
 * Manual Payment Gateway Implementation
 * 
 * Para pagamentos manuais como:
 * - Dinheiro na entrega
 * - Cartão na entrega (maquininha do estabelecimento)
 * - PIX estático
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CreatePaymentResponse,
  GetPaymentResponse,
  RefundRequest,
  RefundResponse,
} from '../types';

export class ManualPaymentGateway {
  private establishmentId: string;

  constructor(establishmentId: string) {
    this.establishmentId = establishmentId;
  }

  async createPayment(
    orderId: string,
    amount: number,
    paymentMethod: 'cash' | 'card_on_delivery' | 'static_pix',
    description?: string
  ): Promise<CreatePaymentResponse> {
    try {
      // Get establishment PIX key if method is static_pix
      let pixKey: string | null = null;
      if (paymentMethod === 'static_pix') {
        const { data: establishment } = await supabase
          .from('establishments')
          .select('pix_key')
          .eq('id', this.establishmentId)
          .single();
        pixKey = establishment?.pix_key || null;
      }

      const paymentId = `manual_${orderId}_${Date.now()}`;

      // Record pending transaction
      await supabase.from('mp_transactions').insert({
        establishment_id: this.establishmentId,
        type: 'sale',
        status: 'pending',
        amount,
        metadata: {
          order_id: orderId,
          payment_method: paymentMethod,
          manual_payment: true,
          description,
        },
      });

      return {
        success: true,
        payment_id: paymentId,
        status: 'pending',
        gateway: 'manual',
        pix_qr_code: pixKey || undefined,
        pix_copy_paste: pixKey || undefined,
      };
    } catch (error) {
      console.error('Manual payment error:', error);
      return {
        success: false,
        payment_id: '',
        status: 'rejected',
        gateway: 'manual',
        error: error instanceof Error ? error.message : 'Erro ao registrar pagamento',
      };
    }
  }

  async confirmPayment(paymentId: string, confirmedBy?: string): Promise<GetPaymentResponse> {
    try {
      // Update transaction status
      const orderId = paymentId.split('_')[1];
      
      await supabase
        .from('mp_transactions')
        .update({
          status: 'approved',
          metadata: {
            confirmed_at: new Date().toISOString(),
            confirmed_by: confirmedBy,
          },
        })
        .eq('metadata->>order_id', orderId)
        .eq('status', 'pending');

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      return {
        success: true,
        payment_id: paymentId,
        status: 'approved',
        amount: 0,
      };
    } catch (error) {
      console.error('Manual payment confirmation error:', error);
      return {
        success: false,
        payment_id: paymentId,
        status: 'pending',
        amount: 0,
        error: error instanceof Error ? error.message : 'Erro ao confirmar pagamento',
      };
    }
  }

  async getPayment(paymentId: string): Promise<GetPaymentResponse> {
    // Manual payments are always pending until confirmed manually
    return {
      success: true,
      payment_id: paymentId,
      status: 'pending',
      amount: 0,
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // Manual refunds need to be processed offline
    return {
      success: false,
      refund_id: '',
      status: 'pending',
      error: 'Estorno de pagamento manual deve ser processado diretamente com o cliente.',
    };
  }
}
