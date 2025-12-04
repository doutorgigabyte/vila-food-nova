import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  timestamp: number | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    timestamp: null,
  });

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
      timestamp: position.timestamp,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Erro ao obter localização';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permissão de localização negada';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Localização indisponível';
        break;
      case error.TIMEOUT:
        errorMessage = 'Tempo esgotado ao obter localização';
        break;
    }
    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não suportada pelo navegador',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  useEffect(() => {
    if (watch && navigator.geolocation) {
      setState(prev => ({ ...prev, loading: true }));
      
      const watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy, timeout, maximumAge }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  return {
    ...state,
    getCurrentPosition,
    isSupported: !!navigator.geolocation,
  };
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

// Check if a point is inside a polygon
export const isPointInPolygon = (
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    
    if (((yi > point.lng) !== (yj > point.lng)) &&
        (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};
