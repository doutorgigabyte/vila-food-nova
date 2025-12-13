import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  pendingOrders: number;
  monthSales: number;
  platformFees: number;
  ordersBySource: {
    marketplace: number;
    direct: number;
    pdv: number;
    whatsapp: number;
  };
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
    platformFees: 0,
    ordersBySource: {
      marketplace: 0,
      direct: 0,
      pdv: 0,
      whatsapp: 0,
    },
  });
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchData = async () => {
    if (!establishmentId) return;

    setLoading(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthISO = monthStart.toISOString();

      // Fetch today's orders with source info
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total, status, order_source, platform_fee')
        .eq('establishment_id', establishmentId)
        .gte('created_at', todayISO);

      // Fetch month's orders with source info
      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total, status, order_source, platform_fee')
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

      // Calculate platform fees
      const platformFees = monthOrders
        ?.filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + ((o as any).platform_fee || 0), 0) || 0;

      // Calculate orders by source
      const ordersBySource = {
        marketplace: monthOrders?.filter(o => (o as any).order_source === 'marketplace').length || 0,
        direct: monthOrders?.filter(o => (o as any).order_source === 'direct' || !(o as any).order_source).length || 0,
        pdv: monthOrders?.filter(o => (o as any).order_source === 'pdv').length || 0,
        whatsapp: monthOrders?.filter(o => (o as any).order_source === 'whatsapp').length || 0,
      };

      setStats({
        todaySales,
        todayOrders: todayCount,
        pendingOrders: pendingCount,
        monthSales,
        platformFees,
        ordersBySource,
      });

      setPendingOrders(pending || []);
      setRecentOrders(recent || []);
      setLastUpdate(new Date());
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
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

      return () => {
        supabase.removeChannel(channel);
        setIsConnected(false);
      };
    }
  }, [establishmentId]);

  return { stats, pendingOrders, recentOrders, loading, refetch: fetchData, lastUpdate, isConnected };
};

export const useUserEstablishment = () => {
  const { user } = useAuth();
  const { slug } = useParams<{ slug?: string }>();
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchUserEstablishment = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is super_admin
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'super_admin'
        });

        setIsSuperAdmin(!!isAdmin);

        // If super_admin and slug is provided, load that establishment
        if (isAdmin && slug) {
          const { data: estBySlug } = await supabase
            .from('establishments')
            .select('*')
            .eq('slug', slug)
            .single();

          if (estBySlug) {
            setEstablishment(estBySlug);
            setEstablishmentId(estBySlug.id);
            setLoading(false);
            return;
          }
        }

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
  }, [user?.id, slug]);

  return { establishmentId, establishment, loading, isSuperAdmin };
};
