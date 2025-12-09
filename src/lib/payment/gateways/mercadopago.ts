/**
 * Mercado Pago Gateway Implementation
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CreatePaymentResponse,
  GetPaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatus,
} from '../types';

export class MercadoPagoGateway {
  private establishmentId: string;

  constructor(establishmentId: string) {
    this.establishmentId = establishmentId;
  }

  async createPixPayment(
    orderId: string,
    amount: number,
    description: string,
    payer?: { email?: string; name?: string }
  ): Promise<CreatePaymentResponse> {
    try {
      console.log('[MercadoPagoGateway] Creating PIX payment:', {
        establishment_id: this.establishmentId,
        order_id: orderId,
        amount,
        description,
      });

      const { data, error } = await supabase.functions.invoke('mercadopago-pix', {
        body: {
          establishment_id: this.establishmentId,
          order_id: orderId,
          amount,
          description,
          payer_email: payer?.email,
          payer_name: payer?.name,
          external_reference: orderId,
        },
      });

      console.log('[MercadoPagoGateway] Edge function response:', {
        has_data: !!data,
        has_error: !!error,
        error_message: error?.message,
        data_type: data?.type,
        data_success: data?.success,
      });

      if (error) {
        console.error('[MercadoPagoGateway] Edge function error:', error);
        throw error;
      }

      if (data.type === 'static_pix') {
        return {
          success: true,
          payment_id: `static_${orderId}`,
          status: 'pending',
          gateway: 'mercadopago',
          pix_qr_code: data.pix_key,
          pix_copy_paste: data.pix_key,
        };
      }

      return {
        success: data.success,
        payment_id: data.payment_id,
        status: data.status as PaymentStatus,
        gateway: 'mercadopago',
        pix_qr_code: data.qr_code,
        pix_qr_code_base64: data.qr_code_base64,
        pix_copy_paste: data.qr_code,
        pix_expiration: data.expiration,
        error: data.error,
      };
    } catch (error) {
      console.error('[MercadoPagoGateway] PIX error:', error);
      return {
        success: false,
        payment_id: '',
        status: 'rejected',
        gateway: 'mercadopago',
        error: error instanceof Error ? error.message : 'Erro ao criar pagamento PIX',
      };
    }
  }

  async createSalePayment(
    orderId: string,
    amount: number,
    description: string,
    paymentMethod: string,
    payer?: { email?: string; name?: string }
  ): Promise<CreatePaymentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-sale', {
        body: {
          establishment_id: this.establishmentId,
          order_id: orderId,
          amount,
          description,
          payment_method: paymentMethod,
          payer_email: payer?.email,
          payer_name: payer?.name,
        },
      });

      if (error) throw error;

      return {
        success: data.success,
        payment_id: data.payment_id,
        status: (data.status || 'pending') as PaymentStatus,
        gateway: 'mercadopago',
        checkout_url: data.checkout_url,
        error: data.error,
      };
    } catch (error) {
      console.error('MercadoPago Sale error:', error);
      return {
        success: false,
        payment_id: '',
        status: 'rejected',
        gateway: 'mercadopago',
        error: error instanceof Error ? error.message : 'Erro ao criar pagamento',
      };
    }
  }

  async getPayment(paymentId: string): Promise<GetPaymentResponse> {
    try {
      // For static PIX, we can't check status
      if (paymentId.startsWith('static_')) {
        return {
          success: true,
          payment_id: paymentId,
          status: 'pending',
          amount: 0,
        };
      }

      const { data, error } = await supabase.functions.invoke('mercadopago-webhook', {
        body: {
          action: 'check_status',
          payment_id: paymentId,
          establishment_id: this.establishmentId,
        },
      });

      if (error) throw error;

      return {
        success: true,
        payment_id: paymentId,
        status: (data.status || 'pending') as PaymentStatus,
        amount: data.transaction_amount || 0,
      };
    } catch (error) {
      console.error('MercadoPago getPayment error:', error);
      return {
        success: false,
        payment_id: paymentId,
        status: 'pending',
        amount: 0,
        error: error instanceof Error ? error.message : 'Erro ao verificar pagamento',
      };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-webhook', {
        body: {
          action: 'refund',
          payment_id: request.payment_id,
          establishment_id: this.establishmentId,
          amount: request.amount,
        },
      });

      if (error) throw error;

      return {
        success: data.success,
        refund_id: data.refund_id || '',
        status: (data.status || 'refunded') as PaymentStatus,
        error: data.error,
      };
    } catch (error) {
      console.error('MercadoPago refund error:', error);
      return {
        success: false,
        refund_id: '',
        status: 'rejected',
        error: error instanceof Error ? error.message : 'Erro ao estornar pagamento',
      };
    }
  }
}
