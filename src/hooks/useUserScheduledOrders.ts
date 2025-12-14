import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface UserScheduledOrder {
  id: string;
  establishment_id: string;
  customer_id: string | null;
  scheduled_for: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  items: Json;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_type: string;
  payment_method: string;
  delivery_address: Json | null;
  notes: string | null;
  created_at: string;
  establishments?: {
    name: string;
    slug: string;
    logo_url: string | null;
  };
}

export const useUserScheduledOrders = () => {
  const [scheduledOrders, setScheduledOrders] = useState<UserScheduledOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchScheduledOrders = useCallback(async () => {
    if (!user) {
      setScheduledOrders([]);
      setLoading(false);
      return;
    }

    try {
      // First get the customer_id for this user
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer) {
        setScheduledOrders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('scheduled_orders')
        .select(`
          *,
          establishments (
            name,
            slug,
            logo_url
          )
        `)
        .eq('customer_id', customer.id)
        .order('scheduled_for', { ascending: true });

      const transformedOrders: UserScheduledOrder[] = (data || []).map(order => ({
        ...order,
        status: order.status as UserScheduledOrder['status'],
      }));
      setScheduledOrders(transformedOrders);
    } catch (error) {
      console.error('[useUserScheduledOrders] Error:', error);
      setScheduledOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScheduledOrders();

    if (!user) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-scheduled-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_orders'
        },
        () => {
          fetchScheduledOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchScheduledOrders, user]);

  const pendingScheduledOrders = scheduledOrders.filter(o => 
    ['pending', 'confirmed'].includes(o.status)
  );
  const completedScheduledOrders = scheduledOrders.filter(o => o.status === 'completed');
  const cancelledScheduledOrders = scheduledOrders.filter(o => o.status === 'cancelled');

  return {
    scheduledOrders,
    pendingScheduledOrders,
    completedScheduledOrders,
    cancelledScheduledOrders,
    loading,
    refetch: fetchScheduledOrders
  };
};
