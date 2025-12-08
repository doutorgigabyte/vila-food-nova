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
  scheduled_for?: string; // ISO date string for scheduled orders
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

      // Insert the order
      const { data: order, error } = await supabase
        .from('orders')
        .insert([{
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
          status: 'pending' as const,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw new Error('Falha ao criar pedido');
      }

      return {
        success: true,
        order,
        orderNumber: order.order_number,
      };
    } catch (error: any) {
      console.error('Create order error:', error);
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
