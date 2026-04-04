import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface Order {
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
  change_for: number | null;
  estimated_time: number | null;
  created_at: string;
}

export const useOrders = (establishmentId?: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!establishmentId && !user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (establishmentId) {
        query = query.eq('establishment_id', establishmentId);
      }

      const { data } = await query;
      setOrders((data as Order[]) || []);
      setLoading(false);
    };

    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: establishmentId ? `establishment_id=eq.${establishmentId}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, user]);

  const createOrder = async (orderData: {
    establishment_id: string;
    items: Json;
    subtotal: number;
    total: number;
    delivery_type?: 'delivery' | 'pickup' | 'table' | 'other';
    payment_method?: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'online';
    delivery_fee?: number;
    discount?: number;
    delivery_address?: Json;
    table_number?: string;
    observations?: string;
    change_for?: number;
  }) => {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivering', 'delivered', 'cancelled'],
      delivering: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    // Validate transition
    const { data: current } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (current && validTransitions[current.status] && !validTransitions[current.status].includes(newStatus)) {
      throw new Error(`Transição inválida: ${current.status} → ${newStatus}`);
    }

    const updateData: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (newStatus === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;
  };

  return { orders, loading, createOrder, updateOrderStatus };
};
