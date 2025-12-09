/**
 * PagSeguro/PagBank Gateway Implementation
 * 
 * Integração completa com PagBank Connect para marketplace.
 * Suporta OAuth, PIX dinâmico e split de pagamento.
 * 
 * Documentação: https://dev.pagbank.uol.com.br/reference
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CreatePaymentResponse,
  GetPaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatus,
} from '../types';

export class PagSeguroGateway {
  private establishmentId: string;

  constructor(establishmentId: string) {
    this.establishmentId = establishmentId;
  }

  /**
   * Gera URL de autorização OAuth para conectar conta PagBank
   */
  async getAuthUrl(): Promise<{ success: boolean; auth_url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('pagseguro-oauth', {
        body: {
          action: 'get_auth_url',
          establishment_id: this.establishmentId,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('PagBank OAuth URL error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Troca código de autorização por access token
   */
  async exchangeCode(code: string, state?: string): Promise<{ success: boolean; account_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('pagseguro-oauth', {
        body: {
          action: 'exchange_code',
          code,
          state,
          establishment_id: this.establishmentId,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('PagBank code exchange error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Renova access token usando refresh token
   */
  async refreshToken(): Promise<{ success: boolean; expires_at?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('pagseguro-oauth', {
        body: {
          action: 'refresh_token',
          establishment_id: this.establishmentId,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('PagBank token refresh error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cria pagamento PIX via PagBank
   */
  async createPixPayment(
    orderId: string,
    amount: number,
    description: string,
    payer?: { email?: string; name?: string; tax_id?: string; phone?: string },
    withSplit: boolean = true
  ): Promise<CreatePaymentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('pagseguro-pix', {
        body: {
          establishment_id: this.establishmentId,
          order_id: orderId,
          amount: Math.round(amount * 100), // Converter para centavos
          description,
          customer: payer,
          with_split: withSplit,
        },
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          payment_id: '',
          status: 'rejected',
          gateway: 'pagseguro',
          error: data.error || 'Erro ao criar pagamento PIX',
        };
      }

      return {
        success: true,
        payment_id: data.payment_id || data.charge_id,
        status: this.mapPagBankStatus(data.status),
        gateway: 'pagseguro',
        pix_qr_code: data.qr_code,
        pix_qr_code_base64: data.qr_code_url,
        pix_copy_paste: data.qr_code,
        pix_expiration: data.expiration,
      };
    } catch (error: any) {
      console.error('PagBank PIX error:', error);
      return {
        success: false,
        payment_id: '',
        status: 'rejected',
        gateway: 'pagseguro',
        error: error.message || 'Erro ao criar pagamento PIX',
      };
    }
  }

  /**
   * Cria pagamento via cartão de crédito usando checkout transparente
   */
  async createCardPayment(
    orderId: string,
    amount: number,
    description: string,
    encryptedCard: string,
    securityCode: string,
    holder: { name: string; tax_id: string },
    installments: number = 1,
    payer?: { email?: string; name?: string; tax_id?: string; phone?: string },
    withSplit: boolean = true
  ): Promise<CreatePaymentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('pagseguro-card', {
        body: {
          establishment_id: this.establishmentId,
          order_id: orderId,
          amount: Math.round(amount * 100), // Converter para centavos
          description,
          encrypted_card: encryptedCard,
          security_code: securityCode,
          holder,
          installments,
          customer: payer,
          with_split: withSplit,
        },
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          payment_id: '',
          status: 'rejected',
          gateway: 'pagseguro',
          error: data.error || 'Pagamento não aprovado',
        };
      }

      return {
        success: true,
        payment_id: data.payment_id || data.charge_id,
        status: this.mapPagBankStatus(data.charge_status || data.status),
        gateway: 'pagseguro',
      };
    } catch (error: any) {
      console.error('PagBank Card error:', error);
      return {
        success: false,
        payment_id: '',
        status: 'rejected',
        gateway: 'pagseguro',
        error: error.message || 'Erro ao processar pagamento com cartão',
      };
    }
  }

  /**
   * Consulta status de um pagamento
   */
  async getPayment(paymentId: string): Promise<GetPaymentResponse> {
    try {
      // Consulta direta via RPC para evitar problemas de tipo
      const { data, error } = await supabase
        .from('mp_transactions')
        .select('id, mp_payment_id, status, amount, created_at, updated_at')
        .eq('mp_payment_id', paymentId)
        .maybeSingle();

      if (error || !data) {
        return {
          success: false,
          payment_id: paymentId,
          status: 'pending',
          amount: 0,
          error: 'Pagamento não encontrado',
        };
      }

      return {
        success: true,
        payment_id: paymentId,
        status: (data.status || 'pending') as PaymentStatus,
        amount: Number(data.amount) || 0,
      };
    } catch (error: any) {
      console.error('PagBank get payment error:', error);
      return {
        success: false,
        payment_id: paymentId,
        status: 'pending',
        amount: 0,
        error: error.message,
      };
    }
  }

  /**
   * Processa estorno de pagamento
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    // TODO: Implementar estorno via API do PagBank
    console.log('PagBank refund - implementation pending', request);
    return {
      success: false,
      refund_id: '',
      status: 'rejected',
      error: 'Estorno PagBank ainda não implementado',
    };
  }

  /**
   * Mapeia status do PagBank para status interno
   */
  private mapPagBankStatus(pagbankStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'AUTHORIZED': 'pending',
      'PAID': 'approved',
      'IN_ANALYSIS': 'in_process',
      'DECLINED': 'rejected',
      'CANCELED': 'cancelled',
      'WAITING': 'pending',
    };
    return statusMap[pagbankStatus] || 'pending';
  }

  /**
   * Verifica se o estabelecimento tem PagBank configurado
   */
  async isConfigured(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('pagseguro_token')
        .eq('id', this.establishmentId)
        .single();

      return !error && !!data?.pagseguro_token;
    } catch {
      return false;
    }
  }
}
