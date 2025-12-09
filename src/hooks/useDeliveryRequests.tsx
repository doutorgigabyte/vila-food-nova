import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryRequest {
  id: string;
  order_id: string;
  establishment_id: string;
  status: 'pending' | 'assigned' | 'expired' | 'cancelled';
  delivery_type: 'standard' | 'turbo';
  calculated_fee: number;
  driver_earnings: number;
  estimated_distance_km: number | null;
  estimated_duration_minutes: number | null;
  stops_count: number;
  pickup_address: string | null;
  delivery_address: string | null;
  customer_name: string | null;
  expires_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
  establishment?: {
    name: string;
    logo_url: string | null;
  };
}

export const useDeliveryRequests = (driverId?: string) => {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    if (!driverId) return;
    
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          establishment:establishments(name, logo_url)
        `)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as DeliveryRequest[]);
    } catch (error) {
      console.error('Error fetching delivery requests:', error);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  const acceptRequest = async (requestId: string): Promise<boolean> => {
    if (!driverId) return false;

    try {
      const { data, error } = await supabase.rpc('accept_delivery_request', {
        p_request_id: requestId,
        p_driver_id: driverId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; driver_earnings?: number };
      
      if (result.success) {
        toast({
          title: "Entrega aceita!",
          description: `Você vai receber R$ ${result.driver_earnings?.toFixed(2)}`,
        });
        // Remove from local state
        setRequests(prev => prev.filter(r => r.id !== requestId));
        return true;
      } else {
        const errorMessages: Record<string, string> = {
          'already_accepted': 'Esta entrega já foi aceita por outro entregador',
          'expired': 'O tempo para aceitar expirou',
          'not_linked': 'Você não está vinculado a este estabelecimento',
          'request_not_found': 'Solicitação não encontrada'
        };
        toast({
          title: "Não foi possível aceitar",
          description: errorMessages[result.error || ''] || 'Erro desconhecido',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error accepting delivery request:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a entrega",
        variant: "destructive"
      });
      return false;
    }
  };

  const rejectRequest = (requestId: string) => {
    // Just remove from local state - driver chose to ignore
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  // Setup realtime subscription
  useEffect(() => {
    if (!driverId) return;

    fetchRequests();

    const channel = supabase
      .channel('delivery-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_requests'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New request - fetch with establishment data
            fetchRequests();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as DeliveryRequest;
            if (updated.status !== 'pending') {
              // Request was accepted or expired - remove from list
              setRequests(prev => prev.filter(r => r.id !== updated.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, fetchRequests]);

  // Auto-expire requests locally
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setRequests(prev => prev.filter(r => new Date(r.expires_at) > now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    requests,
    loading,
    acceptRequest,
    rejectRequest,
    refetch: fetchRequests
  };
};
