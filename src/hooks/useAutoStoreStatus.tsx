import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Support both old format (enabled, open, close) and new format (open, start, end)
interface OperatingHoursDay {
  // New format
  open?: boolean;
  start?: string;
  end?: string;
  // Old format (for backwards compatibility)
  enabled?: boolean;
  close?: string;
}

interface OperatingHours {
  [key: string]: OperatingHoursDay;
}

const dayMapping: { [key: number]: string } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

// Normalize to handle both formats
function normalizeHours(hours: OperatingHoursDay): { isOpen: boolean; start: string; end: string } {
  // Check for 'enabled' (old format) or 'open' (new format)
  const isOpen = hours.enabled ?? hours.open ?? false;
  // Check for 'open' as time (old format) or 'start' (new format)
  const start = hours.start ?? (typeof hours.open === 'string' ? hours.open : '08:00');
  // Check for 'close' (old format) or 'end' (new format)
  const end = hours.end ?? hours.close ?? '22:00';
  
  return { isOpen, start, end };
}

export function isStoreOpenNow(operatingHours: OperatingHours | null): boolean {
  if (!operatingHours) return true; // Se não tem horário configurado, considera aberto

  const now = new Date();
  const currentDay = dayMapping[now.getDay()];
  const todayHours = operatingHours[currentDay];

  if (!todayHours) return false;

  const { isOpen, start, end } = normalizeHours(todayHours);
  
  if (!isOpen) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Caso especial: horário passa da meia-noite (ex: 18:00 - 02:00)
  if (endTime < startTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  return currentTime >= startTime && currentTime <= endTime;
}

export function useAutoStoreStatus(
  establishmentId: string | undefined,
  operatingHours: OperatingHours | null,
  currentIsOpen: boolean | null
) {
  useEffect(() => {
    if (!establishmentId || !operatingHours) return;

    const checkAndUpdateStatus = async () => {
      const shouldBeOpen = isStoreOpenNow(operatingHours);
      
      // Só atualiza se o status atual for diferente do calculado
      if (currentIsOpen !== shouldBeOpen) {
        await supabase
          .from('establishments')
          .update({ is_open: shouldBeOpen })
          .eq('id', establishmentId);
      }
    };

    // Verifica imediatamente
    checkAndUpdateStatus();

    // Verifica a cada minuto
    const interval = setInterval(checkAndUpdateStatus, 60000);

    return () => clearInterval(interval);
  }, [establishmentId, operatingHours, currentIsOpen]);
}
