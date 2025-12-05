import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  pendingOrders: number;
  monthSales: number;
}

interface Order {
  id: string;
  order_number: number;
  customer_id: string | null;
  status: string;
  delivery_type: string;
  payment_method: string;
  items: Json;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: Json;
  observations: string | null;
  created_at: string;
  customer?: {
    name: string;
    phone: string;
  } | null;
}

export const useDashboardData = (establishmentId: string | null) => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    pendingOrders: 0,
    monthSales: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!establishmentId) return;

    setLoading(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthISO = monthStart.toISOString();

      // Fetch today's orders
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total, status')
        .eq('establishment_id', establishmentId)
        .gte('created_at', todayISO);

      // Fetch month's orders
      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total, status')
        .eq('establishment_id', establishmentId)
        .gte('created_at', monthISO);

      // Fetch pending orders with customer data
      const { data: pending } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(name, phone)
        `)
        .eq('establishment_id', establishmentId)
        .in('status', ['pending', 'confirmed', 'preparing'])
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent completed orders
      const { data: recent } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(name, phone)
        `)
        .eq('establishment_id', establishmentId)
        .in('status', ['delivered', 'cancelled', 'ready'])
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate stats
      const todaySales = todayOrders
        ?.filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      
      const todayCount = todayOrders?.length || 0;
      const pendingCount = pending?.length || 0;
      
      const monthSales = monthOrders
        ?.filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      setStats({
        todaySales,
        todayOrders: todayCount,
        pendingOrders: pendingCount,
        monthSales,
      });

      setPendingOrders(pending || []);
      setRecentOrders(recent || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    if (establishmentId) {
      const channel = supabase
        .channel('dashboard-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `establishment_id=eq.${establishmentId}`,
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [establishmentId]);

  return { stats, pendingOrders, recentOrders, loading, refetch: fetchData };
};

export const useUserEstablishment = () => {
  const { user } = useAuth();
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserEstablishment = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // First check if user owns an establishment
        const { data: owned } = await supabase
          .from('establishments')
          .select('*')
          .eq('owner_id', user.id)
          .limit(1)
          .single();

        if (owned) {
          setEstablishment(owned);
          setEstablishmentId(owned.id);
          setLoading(false);
          return;
        }

        // Check establishment_users table
        const { data: userEst } = await supabase
          .from('establishment_users')
          .select(`
            establishment_id,
            role,
            establishments(*)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (userEst) {
          setEstablishment(userEst.establishments);
          setEstablishmentId(userEst.establishment_id);
        }
      } catch (error) {
        console.error('Error fetching user establishment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEstablishment();
  }, [user?.id]);

  return { establishmentId, establishment, loading };
};
