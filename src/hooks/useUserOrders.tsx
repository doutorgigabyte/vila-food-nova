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
      // First get customer record for this user
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer) {
        // No customer record yet - user hasn't made any orders
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch orders for this customer
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          establishments (
            name,
            slug,
            logo_url
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user orders:', error);
        throw error;
      }
      
      console.log('[useUserOrders] Fetched orders:', data?.length || 0, 'for customer:', customer.id);
      setOrders((data as UserOrder[]) || []);
    } catch (error) {
      console.error('Error fetching user orders:', error);
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
