/**
 * Mercado Pago Sale - Vendas com Split de Pagamento
 * 
 * Processa vendas do marketplace onde:
 * - Cliente paga o valor total
 * - Plataforma retém taxa (application_fee)
 * - Restante vai para conta MP do lojista (split)
 * 
 * Usa o access_token do vendedor obtido via OAuth
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token da plataforma para operações de marketplace
const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
// Taxa da plataforma em percentual (ex: 5 = 5%)
const PLATFORM_FEE_PERCENT = parseFloat(Deno.env.get('MERCADOPAGO_PLATFORM_FEE') || '5');

interface SaleRequest {
  action: 'create_payment' | 'get_payment' | 'refund';
  order_id?: string;
  establishment_id: string;
  payment_id?: string;
  // Para criar pagamento
  payment_data?: {
    transaction_amount: number;
    description: string;
    payment_method_id: string; // pix, credit_card, etc
    payer: {
      email: string;
      first_name?: string;
      last_name?: string;
      identification?: {
        type: string; // CPF
        number: string;
      };
    };
    // Para cartão
    token?: string;
    installments?: number;
    issuer_id?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: SaleRequest = await req.json();
    const { action, order_id, establishment_id, payment_id, payment_data } = body;

    console.log('Sale request:', { action, order_id, establishment_id });

    // Buscar dados do estabelecimento (incluindo credentials do MP)
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('*')
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment) {
      throw new Error('Estabelecimento não encontrado');
    }

    switch (action) {
      /**
       * Cria pagamento com split automático
       * 
       * O pagamento é processado na conta da plataforma (MP_ACCESS_TOKEN)
       * mas usando application_fee + transfer_data, o valor líquido
       * vai automaticamente para a conta do vendedor
       */
      case 'create_payment': {
        if (!payment_data) {
          throw new Error('payment_data é obrigatório');
        }

        if (!MP_ACCESS_TOKEN) {
          throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
        }

        // Verificar se vendedor está conectado via OAuth
        if (!establishment.mp_user_id) {
          throw new Error('Estabelecimento não conectou conta Mercado Pago');
        }

        const { transaction_amount, description, payment_method_id, payer, token, installments, issuer_id } = payment_data;

        // Calcular taxa da plataforma
        const platformFee = Math.round((transaction_amount * PLATFORM_FEE_PERCENT / 100) * 100) / 100;
        const netAmount = transaction_amount - platformFee;

        /**
         * Payload do pagamento com split:
         * - application_fee: valor que fica com a plataforma
         * - collector_id: ID do vendedor no MP (obtido via OAuth)
         * 
         * O MP automaticamente:
         * 1. Processa o pagamento total
         * 2. Retém application_fee na conta da plataforma
         * 3. Transfere o restante para o vendedor
         */
        const paymentPayload: Record<string, unknown> = {
          transaction_amount,
          description,
          payment_method_id,
          payer: {
            email: payer.email,
            first_name: payer.first_name,
            last_name: payer.last_name,
            identification: payer.identification,
          },
          external_reference: order_id || `order_${Date.now()}`,
          // Configuração de split/marketplace
          application_fee: platformFee,
          // Dados do recebedor (vendedor)
          collector_id: parseInt(establishment.mp_user_id),
          // Notificação webhook
          notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
        };

        // Adicionar dados de cartão se for pagamento com cartão
        if (payment_method_id !== 'pix' && token) {
          paymentPayload.token = token;
          paymentPayload.installments = installments || 1;
          if (issuer_id) paymentPayload.issuer_id = issuer_id;
        }

        console.log('Creating payment:', { 
          amount: transaction_amount, 
          fee: platformFee, 
          net: netAmount,
          collector: establishment.mp_user_id 
        });

        // Criar pagamento usando token da plataforma
        // O MP usa o collector_id para saber para onde enviar o dinheiro
        const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `${establishment_id}-${order_id || Date.now()}`,
          },
          body: JSON.stringify(paymentPayload),
        });

        if (!paymentResponse.ok) {
          const error = await paymentResponse.json();
          console.error('MP Payment error:', error);
          throw new Error(error.message || 'Erro ao criar pagamento');
        }

        const payment = await paymentResponse.json();
        console.log('Payment created:', {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
        });

        /**
         * Resposta do pagamento:
         * - id: ID do pagamento
         * - status: approved, pending, rejected, etc
         * - status_detail: Detalhe do status
         * - point_of_interaction.transaction_data (para PIX): QR code
         */

        // Registrar transação no banco
        await supabase.from('mp_transactions').insert({
          establishment_id,
          type: 'sale',
          mp_payment_id: payment.id.toString(),
          status: payment.status,
          amount: transaction_amount,
          platform_fee: platformFee,
          net_amount: netAmount,
          payer_email: payer.email,
          payer_name: `${payer.first_name || ''} ${payer.last_name || ''}`.trim(),
          metadata: { 
            order_id, 
            payment_method: payment_method_id,
            status_detail: payment.status_detail,
          },
        });

        // Atualizar pedido se existir
        if (order_id) {
          const orderStatus = payment.status === 'approved' ? 'confirmed' : 
                            payment.status === 'pending' ? 'pending' : 'cancelled';
          
          await supabase
            .from('orders')
            .update({ 
              status: orderStatus,
              payment_method: payment_method_id === 'pix' ? 'pix' : 'card',
            })
            .eq('id', order_id);
        }

        // Preparar resposta
        const response: Record<string, unknown> = {
          success: true,
          payment_id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          platform_fee: platformFee,
          net_amount: netAmount,
        };

        // Adicionar dados do PIX se aplicável
        if (payment_method_id === 'pix' && payment.point_of_interaction?.transaction_data) {
          const pixData = payment.point_of_interaction.transaction_data;
          response.pix = {
            qr_code: pixData.qr_code,
            qr_code_base64: pixData.qr_code_base64,
            expiration_date: payment.date_of_expiration,
          };
        }

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      /**
       * Consulta status de um pagamento
       */
      case 'get_payment': {
        if (!payment_id) {
          throw new Error('payment_id é obrigatório');
        }

        const statusResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${payment_id}`,
          {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
          }
        );

        if (!statusResponse.ok) {
          throw new Error('Pagamento não encontrado');
        }

        const payment = await statusResponse.json();

        return new Response(JSON.stringify({
          success: true,
          payment_id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          amount: payment.transaction_amount,
          date_approved: payment.date_approved,
          payment_method: payment.payment_method_id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      /**
       * Estorna um pagamento
       * Nota: Estorno total retorna application_fee + valor do vendedor
       */
      case 'refund': {
        if (!payment_id) {
          throw new Error('payment_id é obrigatório');
        }

        const refundResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${payment_id}/refunds`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!refundResponse.ok) {
          const error = await refundResponse.json();
          throw new Error(error.message || 'Erro ao estornar');
        }

        const refund = await refundResponse.json();

        // Registrar estorno
        await supabase.from('mp_transactions').insert({
          establishment_id,
          type: 'refund',
          mp_payment_id: payment_id,
          status: 'refunded',
          amount: -refund.amount,
          metadata: { original_payment_id: payment_id, refund_id: refund.id },
        });

        return new Response(JSON.stringify({
          success: true,
          refund_id: refund.id,
          amount: refund.amount,
          message: 'Pagamento estornado com sucesso',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Sale error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * PAYLOADS DE EXEMPLO:
 * 
 * 1. Criar pagamento PIX com split:
 * POST /mercadopago-sale
 * {
 *   "action": "create_payment",
 *   "establishment_id": "uuid-do-estabelecimento",
 *   "order_id": "uuid-do-pedido",
 *   "payment_data": {
 *     "transaction_amount": 100.00,
 *     "description": "Pedido #123 - Hamburgueria do João",
 *     "payment_method_id": "pix",
 *     "payer": {
 *       "email": "cliente@email.com",
 *       "first_name": "João",
 *       "last_name": "Silva",
 *       "identification": {
 *         "type": "CPF",
 *         "number": "12345678900"
 *       }
 *     }
 *   }
 * }
 * 
 * 2. Criar pagamento com cartão:
 * POST /mercadopago-sale
 * {
 *   "action": "create_payment",
 *   "establishment_id": "uuid-do-estabelecimento",
 *   "order_id": "uuid-do-pedido",
 *   "payment_data": {
 *     "transaction_amount": 100.00,
 *     "description": "Pedido #123",
 *     "payment_method_id": "master",
 *     "token": "card_token_from_frontend",
 *     "installments": 1,
 *     "payer": {
 *       "email": "cliente@email.com"
 *     }
 *   }
 * }
 * 
 * 3. Consultar pagamento:
 * POST /mercadopago-sale
 * {
 *   "action": "get_payment",
 *   "establishment_id": "uuid",
 *   "payment_id": "123456789"
 * }
 * 
 * 4. Estornar pagamento:
 * POST /mercadopago-sale
 * {
 *   "action": "refund",
 *   "establishment_id": "uuid",
 *   "payment_id": "123456789"
 * }
 */
