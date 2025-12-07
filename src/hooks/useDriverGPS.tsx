import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

interface UseDriverGPSOptions {
  deliveryId?: string;
  updateInterval?: number; // milliseconds
  enableHighAccuracy?: boolean;
}

export const useDriverGPS = (options: UseDriverGPSOptions = {}) => {
  const {
    deliveryId,
    updateInterval = 10000, // Update every 10 seconds
    enableHighAccuracy = true,
  } = options;

  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const lastSyncRef = useRef<number>(0);

  // Handle position update
  const handlePositionUpdate = useCallback(async (geolocationPosition: GeolocationPosition) => {
    const newPosition: GPSPosition = {
      latitude: geolocationPosition.coords.latitude,
      longitude: geolocationPosition.coords.longitude,
      accuracy: geolocationPosition.coords.accuracy,
      speed: geolocationPosition.coords.speed,
      heading: geolocationPosition.coords.heading,
      timestamp: geolocationPosition.timestamp,
    };

    setPosition(newPosition);
    setError(null);

    // Throttle database updates
    const now = Date.now();
    if (deliveryId && now - lastSyncRef.current >= updateInterval) {
      lastSyncRef.current = now;
      
      try {
        const { error: updateError } = await supabase
          .from('delivery_tracking')
          .update({
            current_lat: newPosition.latitude,
            current_lng: newPosition.longitude,
            updated_at: new Date().toISOString(),
          })
          .eq('id', deliveryId);

        if (updateError) {
          console.error('Error updating location:', updateError);
        } else {
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Error syncing location:', err);
      }
    }
  }, [deliveryId, updateInterval]);

  // Handle position error
  const handlePositionError = useCallback((positionError: GeolocationPositionError) => {
    let errorMessage = 'Erro ao obter localização';
    switch (positionError.code) {
      case positionError.PERMISSION_DENIED:
        errorMessage = 'Permissão de localização negada. Ative o GPS nas configurações.';
        break;
      case positionError.POSITION_UNAVAILABLE:
        errorMessage = 'Localização indisponível. Verifique se o GPS está ativo.';
        break;
      case positionError.TIMEOUT:
        errorMessage = 'Tempo esgotado ao obter localização. Tente novamente.';
        break;
    }
    setError(errorMessage);
    console.error('GPS Error:', errorMessage);
  }, []);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      toast.error('GPS não suportado neste dispositivo');
      return false;
    }

    if (watchIdRef.current !== null) {
      return true; // Already tracking
    }

    setIsTracking(true);
    setError(null);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handlePositionUpdate,
      handlePositionError,
      { enableHighAccuracy, timeout: 15000, maximumAge: 0 }
    );

    // Start continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy,
        timeout: 30000,
        maximumAge: 5000,
      }
    );

    toast.success('Rastreamento GPS ativado');
    return true;
  }, [enableHighAccuracy, handlePositionUpdate, handlePositionError]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast.info('Rastreamento GPS desativado');
  }, []);

  // Get current position once
  const getCurrentPosition = useCallback(() => {
    return new Promise<GPSPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const gpsPos: GPSPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: pos.timestamp,
          };
          setPosition(gpsPos);
          resolve(gpsPos);
        },
        (err) => {
          handlePositionError(err);
          reject(err);
        },
        { enableHighAccuracy, timeout: 15000, maximumAge: 0 }
      );
    });
  }, [enableHighAccuracy, handlePositionError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Auto-start tracking when deliveryId is provided
  useEffect(() => {
    if (deliveryId && !isTracking) {
      startTracking();
    }
  }, [deliveryId, isTracking, startTracking]);

  return {
    position,
    isTracking,
    error,
    lastUpdate,
    startTracking,
    stopTracking,
    getCurrentPosition,
    isSupported: !!navigator.geolocation,
  };
};

export default useDriverGPS;
