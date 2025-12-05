/**
 * PagSeguro Gateway Implementation (Placeholder)
 * 
 * Este é um placeholder para futura integração com PagSeguro.
 * Quando implementado, seguirá a mesma interface do MercadoPago.
 */

import type {
  CreatePaymentResponse,
  GetPaymentResponse,
  RefundRequest,
  RefundResponse,
} from '../types';

export class PagSeguroGateway {
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
    // TODO: Implementar integração PagSeguro PIX
    console.log('PagSeguro PIX not implemented yet');
    return {
      success: false,
      payment_id: '',
      status: 'rejected',
      gateway: 'pagseguro',
      error: 'PagSeguro PIX não implementado. Use Mercado Pago.',
    };
  }

  async createSalePayment(
    orderId: string,
    amount: number,
    description: string,
    paymentMethod: string,
    payer?: { email?: string; name?: string }
  ): Promise<CreatePaymentResponse> {
    // TODO: Implementar integração PagSeguro Checkout
    console.log('PagSeguro Sale not implemented yet');
    return {
      success: false,
      payment_id: '',
      status: 'rejected',
      gateway: 'pagseguro',
      error: 'PagSeguro Checkout não implementado. Use Mercado Pago.',
    };
  }

  async getPayment(paymentId: string): Promise<GetPaymentResponse> {
    // TODO: Implementar verificação de pagamento PagSeguro
    return {
      success: false,
      payment_id: paymentId,
      status: 'pending',
      amount: 0,
      error: 'Verificação PagSeguro não implementada.',
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // TODO: Implementar estorno PagSeguro
    return {
      success: false,
      refund_id: '',
      status: 'rejected',
      error: 'Estorno PagSeguro não implementado.',
    };
  }
}
