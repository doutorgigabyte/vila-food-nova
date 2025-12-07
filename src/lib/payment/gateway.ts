/**
 * Payment Gateway - Abstração para múltiplos gateways de pagamento
 * Implementação modular seguindo Strategy Pattern
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  GetPaymentResponse,
  RefundRequest,
  RefundResponse,
  GatewayProvider,
  PaymentMethod,
  PaymentStatus,
} from './types';

export class PaymentGateway {
  private provider: GatewayProvider;
  private establishmentId: string;

  constructor(establishmentId: string, provider: GatewayProvider = 'mercadopago') {
    this.establishmentId = establishmentId;
    this.provider = provider;
  }

  /**
   * Create a new payment
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      switch (this.provider) {
        case 'mercadopago':
          return await this.createMercadoPagoPayment(request);
        case 'pagseguro':
          return await this.createPagSeguroPayment(request);
        case 'manual':
          return await this.createManualPayment(request);
        default:
          throw new Error(`Gateway ${this.provider} não suportado`);
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        status: 'rejected',
        gateway: this.provider,
        error: error instanceof Error ? error.message : 'Erro ao criar pagamento',
      };
    }
  }

  /**
   * Create PIX payment specifically
   */
  async createPixPayment(
    orderId: string,
    amount: number,
    description: string,
    payer?: { email?: string; name?: string }
  ): Promise<CreatePaymentResponse> {
    try {
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

      if (error) throw error;

      if (data.success) {
        return {
          success: true,
          payment_id: data.payment_id?.toString(),
          status: data.status === 'approved' ? 'approved' : 'pending',
          gateway: 'mercadopago',
          pix_qr_code: data.qr_code,
          pix_qr_code_base64: data.qr_code_base64 || data.qr_code_url,
          pix_copy_paste: data.qr_code,
          pix_expiration: data.expiration,
        };
      }

      // Static PIX fallback
      if (data.type === 'static_pix') {
        return {
          success: true,
          status: 'pending',
          gateway: 'manual',
          pix_copy_paste: data.pix_key,
        };
      }

      return {
        success: false,
        status: 'rejected',
        gateway: 'mercadopago',
        error: data.error || 'Erro ao criar PIX',
      };
    } catch (error) {
      console.error('PIX creation error:', error);
      return {
        success: false,
        status: 'rejected',
        gateway: 'mercadopago',
        error: error instanceof Error ? error.message : 'Erro ao criar PIX',
      };
    }
  }

  /**
   * Get payment status
   */
  async getPayment(paymentId: string): Promise<GetPaymentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-sale', {
        body: {
          action: 'get_payment',
          establishment_id: this.establishmentId,
          payment_id: paymentId,
        },
      });

      if (error) throw error;

      if (data.success) {
        return {
          success: true,
          payment_id: data.payment_id,
          status: data.status,
          status_detail: data.status_detail,
          amount: data.amount,
          date_approved: data.date_approved,
          payment_method: data.payment_method,
        };
      }

      return {
        success: false,
        payment_id: paymentId,
        status: 'rejected',
        amount: 0,
        error: data.error,
      };
    } catch (error) {
      return {
        success: false,
        payment_id: paymentId,
        status: 'rejected',
        amount: 0,
        error: error instanceof Error ? error.message : 'Erro ao consultar pagamento',
      };
    }
  }

  /**
   * Process refund
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-sale', {
        body: {
          action: 'refund',
          establishment_id: this.establishmentId,
          payment_id: request.payment_id,
        },
      });

      if (error) throw error;

      return {
        success: data.success,
        refund_id: data.refund_id,
        amount: data.amount,
        status: 'refunded',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao estornar',
      };
    }
  }

  /**
   * Create Mercado Pago payment via sale endpoint
   */
  private async createMercadoPagoPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const paymentMethodMap: Record<PaymentMethod, string> = {
      pix: 'pix',
      credit_card: 'credit_card',
      debit_card: 'debit_card',
      boleto: 'bolbradesco',
      cash: 'cash',
      wallet: 'account_money',
      static_pix: 'pix',
    };

    const { data, error } = await supabase.functions.invoke('mercadopago-sale', {
      body: {
        action: 'create_payment',
        order_id: request.order_id,
        establishment_id: this.establishmentId,
        payment_data: {
          transaction_amount: request.amount,
          description: request.description,
          payment_method_id: paymentMethodMap[request.payment_method] || request.payment_method,
          payer: {
            email: request.payer.email,
            first_name: request.payer.name?.split(' ')[0],
            last_name: request.payer.name?.split(' ').slice(1).join(' '),
            identification: request.payer.document
              ? {
                  type: request.payer.document.type,
                  number: request.payer.document.number,
                }
              : undefined,
          },
          token: request.card_token,
          installments: request.installments,
          issuer_id: request.issuer_id,
        },
      },
    });

    if (error) throw error;

    if (!data.success) {
      return {
        success: false,
        status: 'rejected',
        gateway: 'mercadopago',
        error: data.error,
      };
    }

    const response: CreatePaymentResponse = {
      success: true,
      payment_id: data.payment_id?.toString(),
      status: data.status as PaymentStatus,
      status_detail: data.status_detail,
      gateway: 'mercadopago',
      platform_fee: data.platform_fee,
      net_amount: data.net_amount,
    };

    // Add PIX data if available
    if (data.pix) {
      response.pix_qr_code = data.pix.qr_code;
      response.pix_qr_code_base64 = data.pix.qr_code_base64;
      response.pix_expiration = data.pix.expiration_date;
    }

    return response;
  }

  /**
   * PagSeguro placeholder - implement when needed
   */
  private async createPagSeguroPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    // TODO: Implement PagSeguro integration
    return {
      success: false,
      status: 'rejected',
      gateway: 'pagseguro',
      error: 'PagSeguro ainda não implementado',
    };
  }

  /**
   * Manual payment (cash, etc.)
   */
  private async createManualPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    // For manual payments, just return pending status
    return {
      success: true,
      status: 'pending',
      gateway: 'manual',
    };
  }

  /**
   * Static helper to get status label in Portuguese
   */
  static getStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      authorized: 'Autorizado',
      in_process: 'Em processamento',
      in_mediation: 'Em mediação',
      rejected: 'Recusado',
      cancelled: 'Cancelado',
      refunded: 'Estornado',
      charged_back: 'Contestado',
    };
    return labels[status] || status;
  }

  /**
   * Static helper to get payment method label
   */
  static getMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      boleto: 'Boleto',
      cash: 'Dinheiro',
      wallet: 'Carteira Digital',
      static_pix: 'PIX Copia e Cola',
    };
    return labels[method] || method;
  }

  /**
   * Static helper to get status color
   */
  static getStatusColor(status: PaymentStatus): string {
    const colors: Record<PaymentStatus, string> = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      authorized: 'bg-blue-500',
      in_process: 'bg-yellow-500',
      in_mediation: 'bg-orange-500',
      rejected: 'bg-red-500',
      cancelled: 'bg-gray-500',
      refunded: 'bg-purple-500',
      charged_back: 'bg-red-700',
    };
    return colors[status] || 'bg-gray-500';
  }
}

/**
 * Hook-friendly factory function
 */
export function createPaymentGateway(
  establishmentId: string,
  provider: GatewayProvider = 'mercadopago'
): PaymentGateway {
  return new PaymentGateway(establishmentId, provider);
}
