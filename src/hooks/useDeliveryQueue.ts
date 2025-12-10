import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryQueueItem {
  id: string;
  order_id: string;
  driver_id: string | null;
  establishment_id: string;
  queue_position: number;
  estimated_pickup_at: string | null;
  estimated_delivery_at: string | null;
  actual_pickup_at: string | null;
  actual_delivery_at: string | null;
  estimated_duration_minutes: number | null;
  distance_km: number | null;
  is_delayed: boolean;
  delay_notified_at: string | null;
  created_at: string;
}

interface QueueInfo {
  position: number;
  totalInQueue: number;
  estimatedMinutes: number | null;
  isDelayed: boolean;
  ordersAhead: number;
}

export const useDeliveryQueue = (orderId: string) => {
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueueInfo = async () => {
      try {
        // Get current order's queue info
        const { data: queueItem, error } = await supabase
          .from('delivery_queue')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (error || !queueItem) {
          setLoading(false);
          return;
        }

        // Get total orders in this driver's queue
        const { count } = await supabase
          .from('delivery_queue')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', queueItem.driver_id)
          .is('actual_delivery_at', null);

        setQueueInfo({
          position: queueItem.queue_position,
          totalInQueue: count || 1,
          estimatedMinutes: queueItem.estimated_duration_minutes,
          isDelayed: queueItem.is_delayed,
          ordersAhead: Math.max(0, queueItem.queue_position - 1),
        });
      } catch (err) {
        console.error('Error fetching queue info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueueInfo();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`queue-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_queue',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new) {
            const item = payload.new as DeliveryQueueItem;
            setQueueInfo((prev) => ({
              ...prev!,
              position: item.queue_position,
              estimatedMinutes: item.estimated_duration_minutes,
              isDelayed: item.is_delayed,
              ordersAhead: Math.max(0, item.queue_position - 1),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { queueInfo, loading };
};

export const useEstablishmentDeliveryQueue = (establishmentId: string, driverId?: string) => {
  const [queue, setQueue] = useState<DeliveryQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        let query = supabase
          .from('delivery_queue')
          .select('*')
          .eq('establishment_id', establishmentId)
          .is('actual_delivery_at', null)
          .order('queue_position', { ascending: true });

        if (driverId) {
          query = query.eq('driver_id', driverId);
        }

        const { data, error } = await query;

        if (!error && data) {
          setQueue(data as DeliveryQueueItem[]);
        }
      } catch (err) {
        console.error('Error fetching establishment queue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();

    const channel = supabase
      .channel(`est-queue-${establishmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_queue',
          filter: `establishment_id=eq.${establishmentId}`,
        },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, driverId]);

  return { queue, loading };
};
