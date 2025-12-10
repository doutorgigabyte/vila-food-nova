import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getOrderSourceDirect, OrderSource } from './useOrderSource';

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
  additionals?: any[];
  variation?: any;
}

export interface CreateOrderData {
  establishment_id: string;
  customer_id?: string;
  delivery_type: 'delivery' | 'pickup' | 'table';
  payment_method: 'pix' | 'cash' | 'credit_card' | 'debit_card';
  items: OrderItem[];
  subtotal: number;
  delivery_fee?: number;
  discount?: number;
  platform_fee?: number;
  total: number;
  delivery_address?: {
    cep: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    reference?: string;
  };
  change_for?: number;
  observations?: string;
  table_number?: string;
  order_source?: OrderSource;
  scheduled_for?: string;
  whatsapp_tracking_enabled?: boolean;
  customer_phone?: string;
  // 99Food-style fields
  cpf?: string;
  out_of_stock_action?: 'contact_me' | 'cancel_order' | 'cancel_item';
}

export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false);

  const createOrder = async (orderData: CreateOrderData) => {
    setLoading(true);

    try {
      // Get the order source from session storage if not provided
      const orderSource = orderData.order_source || getOrderSourceDirect();
      
      // First, try to find or create customer
      const customerId = orderData.customer_id;

      // DEBUG: Log the order data being sent
      const orderPayload = {
        establishment_id: orderData.establishment_id,
        customer_id: customerId || null,
        delivery_type: orderData.delivery_type,
        payment_method: orderData.payment_method,
        items: orderData.items as any,
        subtotal: orderData.subtotal,
        delivery_fee: orderData.delivery_fee || 0,
        discount: orderData.discount || 0,
        platform_fee: orderData.platform_fee || 0,
        order_source: orderSource,
        total: orderData.total,
        delivery_address: orderData.delivery_address as any || null,
        change_for: orderData.change_for || null,
        observations: orderData.observations || null,
        table_number: orderData.table_number || null,
        scheduled_for: orderData.scheduled_for || null,
        whatsapp_tracking_enabled: orderData.whatsapp_tracking_enabled ?? false,
        customer_phone: orderData.customer_phone || null,
        cpf: orderData.cpf || null,
        out_of_stock_action: orderData.out_of_stock_action || 'contact_me',
        status: 'pending' as const,
      };
      
      console.log('[useCreateOrder] Creating order with payload:', {
        establishment_id: orderPayload.establishment_id,
        delivery_type: orderPayload.delivery_type,
        payment_method: orderPayload.payment_method,
        total: orderPayload.total,
        items_count: orderPayload.items?.length || 0,
      });

      // Insert the order
      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (error) {
        console.error('[useCreateOrder] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(error.message || 'Falha ao criar pedido');
      }

      console.log('[useCreateOrder] Order created successfully:', {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
      });

      // Send WhatsApp notification to merchant (async, don't block)
      supabase.functions.invoke('notify-merchant-order', {
        body: {
          order_id: order.id,
          establishment_id: orderData.establishment_id,
          notification_type: 'new_order',
        },
      }).catch((err) => {
        console.warn('[useCreateOrder] Failed to send merchant notification:', err);
      });

      // MODELO BLINDADO: Register commission debt for cash/card-on-delivery payments
      if (orderData.payment_method === 'cash' || orderData.payment_method === 'debit_card') {
        try {
          const productsAmount = orderData.subtotal - (orderData.discount || 0);
          const platformProductFee = productsAmount * 0.05; // 5% dos produtos
          const platformServiceFee = 1; // R$1 taxa de serviço
          const totalCommissionDue = platformProductFee + platformServiceFee;

          const { error: debtError } = await supabase
            .from('establishment_commission_debt')
            .insert({
              establishment_id: orderData.establishment_id,
              order_id: order.id,
              products_amount: productsAmount,
              delivery_fee: orderData.delivery_fee || 0,
              total_order: orderData.total,
              platform_product_fee: platformProductFee,
              platform_service_fee: platformServiceFee,
              total_commission_due: totalCommissionDue,
              status: 'pending',
            });

          if (debtError) {
            console.error('[useCreateOrder] Error registering commission debt:', debtError);
            // Don't block order creation if debt registration fails
          } else {
            console.log('[useCreateOrder] Commission debt registered:', {
              order_id: order.id,
              commission_due: totalCommissionDue,
            });

            // Mark order as having commission debt created
            await supabase
              .from('orders')
              .update({ commission_debt_created: true })
              .eq('id', order.id);
          }
        } catch (debtError) {
          console.error('[useCreateOrder] Exception registering commission debt:', debtError);
        }
      }

      return {
        success: true,
        order,
        orderNumber: order.order_number,
      };
    } catch (error: any) {
      console.error('[useCreateOrder] Error:', error);
      toast.error(error.message || 'Erro ao criar pedido');
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const createMultipleOrders = async (orders: CreateOrderData[]) => {
    setLoading(true);
    const results: { establishment: string; orderNumber: number; success: boolean }[] = [];

    try {
      for (const orderData of orders) {
        const result = await createOrder(orderData);
        results.push({
          establishment: orderData.establishment_id,
          orderNumber: result.order?.order_number || 0,
          success: result.success,
        });
      }

      return {
        success: results.every(r => r.success),
        results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        results,
      };
    } finally {
      setLoading(false);
    }
  };

  return { createOrder, createMultipleOrders, loading };
};
