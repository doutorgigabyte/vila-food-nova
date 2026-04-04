import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isStoreOpenNow } from './useAutoStoreStatus';

interface OperatingHoursDay {
  open?: boolean;
  enabled?: boolean;
  start?: string;
  end?: string;
  close?: string;
}

interface OperatingHours {
  [key: string]: OperatingHoursDay;
}

interface UseStoreOpenStatusReturn {
  isOpen: boolean | null;
  loading: boolean;
  operatingHours: OperatingHours | null;
  shouldBeOpenBySchedule: boolean;
  openStore: () => Promise<void>;
  closeStore: () => Promise<void>;
  toggleStore: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useStoreOpenStatus(establishmentId: string | undefined): UseStoreOpenStatusReturn {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [operatingHours, setOperatingHours] = useState<OperatingHours | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!establishmentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('is_open, operating_hours')
        .eq('id', establishmentId)
        .single();

      if (error) throw error;

      setIsOpen(data?.is_open ?? null);
      setOperatingHours(data?.operating_hours as OperatingHours ?? null);
    } catch (error) {
      console.error('[useStoreOpenStatus] Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    fetchStatus();

    // Subscribe to realtime updates
    if (!establishmentId) return;

    const channel = supabase
      .channel(`store-status-${establishmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'establishments',
          filter: `id=eq.${establishmentId}`,
        },
        (payload) => {
          if (payload.new) {
            setIsOpen((payload.new as any).is_open ?? null);
            setOperatingHours((payload.new as any).operating_hours ?? null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, fetchStatus]);

  const shouldBeOpenBySchedule = operatingHours ? isStoreOpenNow(operatingHours) : true;

  const openStore = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const { error } = await supabase
        .from('establishments')
        .update({ is_open: true })
        .eq('id', establishmentId);

      if (error) throw error;
      setIsOpen(true);
    } catch (error) {
      console.error('[useStoreOpenStatus] Error opening store:', error);
      throw error;
    }
  }, [establishmentId]);

  const closeStore = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const { error } = await supabase
        .from('establishments')
        .update({ is_open: false })
        .eq('id', establishmentId);

      if (error) throw error;
      setIsOpen(false);
    } catch (error) {
      console.error('[useStoreOpenStatus] Error closing store:', error);
      throw error;
    }
  }, [establishmentId]);

  const toggleStore = useCallback(async () => {
    if (isOpen) {
      await closeStore();
    } else {
      await openStore();
    }
  }, [isOpen, openStore, closeStore]);

  return {
    isOpen,
    loading,
    operatingHours,
    shouldBeOpenBySchedule,
    openStore,
    closeStore,
    toggleStore,
    refreshStatus: fetchStatus,
  };
}
