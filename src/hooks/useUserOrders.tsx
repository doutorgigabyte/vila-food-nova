import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface UserOrder {
  id: string;
  order_number: number;
  establishment_id: string;
  customer_id: string | null;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  delivery_type: 'delivery' | 'pickup' | 'table' | 'other';
  payment_method: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'online';
  items: Json;
  subtotal: number;
  delivery_fee: number | null;
  discount: number | null;
  total: number;
  delivery_address: Json | null;
  table_number: string | null;
  observations: string | null;
  created_at: string;
  estimated_time: number | null;
  establishments?: {
    name: string;
    slug: string;
    logo_url: string | null;
  };
}

interface RpcOrderResult {
  id: string;
  order_number: number;
  establishment_id: string;
  customer_id: string;
  status: string;
  delivery_type: string;
  payment_method: string;
  items: Json;
  subtotal: number;
  delivery_fee: number | null;
  discount: number | null;
  total: number;
  delivery_address: Json | null;
  table_number: string | null;
  observations: string | null;
  created_at: string;
  estimated_time: number | null;
  establishment_name: string;
  establishment_slug: string;
  establishment_logo_url: string | null;
}

export const useUserOrders = () => {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      // Use RPC function that bypasses RLS issues
      const { data, error } = await supabase.rpc('get_user_orders');

      if (error) {
        console.error('[useUserOrders] RPC error:', error);
        throw error;
      }

      // Transform RPC result to match UserOrder interface
      const transformedOrders: UserOrder[] = (data as RpcOrderResult[] || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        establishment_id: order.establishment_id,
        customer_id: order.customer_id,
        status: order.status as UserOrder['status'],
        delivery_type: order.delivery_type as UserOrder['delivery_type'],
        payment_method: order.payment_method as UserOrder['payment_method'],
        items: order.items,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        discount: order.discount,
        total: order.total,
        delivery_address: order.delivery_address,
        table_number: order.table_number,
        observations: order.observations,
        created_at: order.created_at,
        estimated_time: order.estimated_time,
        establishments: {
          name: order.establishment_name,
          slug: order.establishment_slug,
          logo_url: order.establishment_logo_url,
        },
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('[useUserOrders] Error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();

    if (!user) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, user]);

  const activeOrders = orders.filter(o => 
    ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status)
  );

  const completedOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  return {
    orders,
    activeOrders,
    completedOrders,
    cancelledOrders,
    loading,
    refetch: fetchOrders
  };
};
