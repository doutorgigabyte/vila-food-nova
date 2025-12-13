import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type DeliveryStatus = 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'problem';

export interface DeliveryTracking {
  id: string;
  order_id: string;
  driver_id: string;
  establishment_id: string;
  status: DeliveryStatus;
  current_lat: number | null;
  current_lng: number | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  distance_km: number | null;
  estimated_minutes: number | null;
  route_polyline: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    order_number: number;
    total: number;
    delivery_fee: number | null;
    delivery_type: string | null;
    delivery_address: any;
    items: any[];
    payment_method: string;
    customer?: {
      name: string;
      phone: string;
    };
  };
  establishment?: {
    id: string;
    name: string;
    address: string;
    phone: string;
    logo_url: string;
  };
}

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle_type: string | null;
  license_plate: string | null;
  is_active: boolean;
  is_available: boolean;
  establishment_id: string;
  user_id: string;
}

export const useDriverDeliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryTracking[]>([]);
  const [currentDelivery, setCurrentDelivery] = useState<DeliveryTracking | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch driver profile
  const fetchDriverProfile = useCallback(async () => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('delivery_drivers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching driver profile:', error);
      return null;
    }

    setDriverProfile(data);
    setIsOnline(data?.is_available ?? false);
    return data;
  }, [user?.id]);

  // Fetch deliveries
  const fetchDeliveries = useCallback(async () => {
    if (!driverProfile?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select(`
          *,
          order:orders(
            id,
            order_number,
            total,
            delivery_fee,
            delivery_type,
            delivery_address,
            items,
            payment_method,
            customer:customers(name, phone)
          ),
          establishment:establishments(id, name, address, phone, logo_url)
        `)
        .eq('driver_id', driverProfile.id)
        .in('status', ['assigned', 'accepted', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as unknown as DeliveryTracking[];
      setDeliveries(typedData);
      
      // Set current active delivery
      const active = typedData.find(d => 
        ['accepted', 'picked_up', 'in_transit'].includes(d.status)
      );
      setCurrentDelivery(active || null);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Erro ao carregar entregas');
    } finally {
      setIsLoading(false);
    }
  }, [driverProfile?.id]);

  // Toggle online/offline status
  const toggleOnlineStatus = async () => {
    if (!driverProfile?.id) return;

    const newStatus = !isOnline;
    const { error } = await supabase
      .from('delivery_drivers')
      .update({ is_available: newStatus })
      .eq('id', driverProfile.id);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    setIsOnline(newStatus);
    toast.success(newStatus ? 'Você está online!' : 'Você está offline');
  };

  // Update delivery status
  const updateDeliveryStatus = async (
    deliveryId: string, 
    status: DeliveryStatus,
    additionalData?: Partial<DeliveryTracking>
  ) => {
    // Buscar o delivery para pegar o order_id
    const delivery = deliveries.find(d => d.id === deliveryId);
    
    const updateData: any = { 
      status,
      ...additionalData
    };

    // Add timestamps based on status
    if (status === 'accepted') updateData.accepted_at = new Date().toISOString();
    if (status === 'picked_up') updateData.picked_up_at = new Date().toISOString();
    if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
    if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();

    const { error } = await supabase
      .from('delivery_tracking')
      .update(updateData)
      .eq('id', deliveryId);

    if (error) {
      toast.error('Erro ao atualizar entrega');
      return false;
    }

    // Sincronizar status do pedido (orders) com o delivery_tracking
    if (delivery?.order_id) {
      const orderStatusMap: Record<DeliveryStatus, string | null> = {
        assigned: null, // Não atualiza orders
        accepted: 'delivering',
        picked_up: 'delivering',
        in_transit: 'delivering',
        delivered: 'delivered',
        cancelled: 'cancelled',
        problem: null
      };

      const newOrderStatus = orderStatusMap[status];
      if (newOrderStatus) {
        const orderUpdateData: any = { status: newOrderStatus };
        if (status === 'delivered') {
          orderUpdateData.delivered_at = new Date().toISOString();
        }
        
        await supabase
          .from('orders')
          .update(orderUpdateData)
          .eq('id', delivery.order_id);
      }
    }

    await fetchDeliveries();
    
    const statusMessages: Record<DeliveryStatus, string> = {
      assigned: 'Entrega atribuída',
      accepted: 'Entrega aceita!',
      picked_up: 'Pedido coletado!',
      in_transit: 'A caminho do cliente',
      delivered: 'Entrega concluída!',
      cancelled: 'Entrega cancelada',
      problem: 'Problema reportado'
    };
    
    toast.success(statusMessages[status]);
    return true;
  };

  // Update current location
  const updateLocation = async (lat: number, lng: number) => {
    if (!currentDelivery?.id) return;

    await supabase
      .from('delivery_tracking')
      .update({
        current_lat: lat,
        current_lng: lng
      })
      .eq('id', currentDelivery.id);
  };

  // Fetch delivery history
  const fetchDeliveryHistory = async (limit = 20) => {
    if (!driverProfile?.id) return [];

    const { data, error } = await supabase
      .from('delivery_tracking')
      .select(`
        *,
        order:orders(id, order_number, total),
        establishment:establishments(name, logo_url)
      `)
      .eq('driver_id', driverProfile.id)
      .in('status', ['delivered', 'cancelled'])
      .order('delivered_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    return data || [];
  };

  // Get today's stats
  const getTodayStats = useCallback(async () => {
    if (!driverProfile?.id) return { deliveries: 0, earnings: 0, distance: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('delivery_tracking')
      .select('id, distance_km, order:orders(delivery_fee)')
      .eq('driver_id', driverProfile.id)
      .eq('status', 'delivered')
      .gte('delivered_at', today.toISOString());

    if (error || !data) return { deliveries: 0, earnings: 0, distance: 0 };

    const totalDeliveries = data.length;
    const totalDistance = data.reduce((sum, d) => sum + (d.distance_km || 0), 0);
    const totalEarnings = data.reduce((sum, d) => {
      const fee = (d.order as any)?.delivery_fee || 0;
      return sum + fee;
    }, 0);

    return {
      deliveries: totalDeliveries,
      earnings: totalEarnings,
      distance: totalDistance
    };
  }, [driverProfile?.id]);

  // Setup realtime subscription
  useEffect(() => {
    if (!driverProfile?.id) return;

    const channel = supabase
      .channel('driver-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_tracking',
          filter: `driver_id=eq.${driverProfile.id}`
        },
        (payload) => {
          console.log('Delivery update:', payload);
          fetchDeliveries();
          
          if (payload.eventType === 'INSERT') {
            toast.info('Nova entrega disponível!', {
              duration: 10000
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverProfile?.id, fetchDeliveries]);

  // Initial fetch
  useEffect(() => {
    fetchDriverProfile();
  }, [fetchDriverProfile]);

  useEffect(() => {
    if (driverProfile) {
      fetchDeliveries();
    }
  }, [driverProfile, fetchDeliveries]);

  return {
    deliveries,
    currentDelivery,
    driverProfile,
    isLoading,
    isOnline,
    toggleOnlineStatus,
    updateDeliveryStatus,
    updateLocation,
    fetchDeliveryHistory,
    getTodayStats,
    refetch: fetchDeliveries
  };
};
