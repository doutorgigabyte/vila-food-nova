import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OperatingHours {
  [key: string]: {
    open: boolean;
    start: string;
    end: string;
  };
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

export function isStoreOpenNow(operatingHours: OperatingHours | null): boolean {
  if (!operatingHours) return true; // Se não tem horário configurado, considera aberto

  const now = new Date();
  const currentDay = dayMapping[now.getDay()];
  const todayHours = operatingHours[currentDay];

  if (!todayHours || !todayHours.open) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = todayHours.start.split(':').map(Number);
  const [endHour, endMin] = todayHours.end.split(':').map(Number);
  
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
