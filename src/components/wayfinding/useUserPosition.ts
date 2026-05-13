import { useCallback, useEffect, useRef, useState } from "react";

export type PermissionState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

export interface UserPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

interface UseUserPositionOptions {
  /** Quando true, ja solicita posicao na montagem. Default: false (usuario opt-in). */
  autoRequest?: boolean;
  /** Mantem watch ativo (turn-by-turn). Default: false. */
  watch?: boolean;
}

/**
 * Encapsula geolocation API com fallback graceful.
 * Pede permissao explicita via `request()` para respeitar LGPD/UX.
 */
export const useUserPosition = (opts: UseUserPositionOptions = {}) => {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [permission, setPermission] = useState<PermissionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    });
    setPermission("granted");
    setError(null);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      setPermission("denied");
      setError("Permissao de localizacao negada");
    } else {
      setError(err.message);
    }
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unavailable");
      setError("Geolocation nao suportado neste dispositivo");
      return;
    }
    setPermission("requesting");
    if (opts.watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 5_000,
      });
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 30_000,
      });
    }
  }, [opts.watch, handleSuccess, handleError]);

  const clear = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setPosition(null);
    setPermission("idle");
    setError(null);
  }, []);

  useEffect(() => {
    if (opts.autoRequest) request();
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [opts.autoRequest, request]);

  return { position, permission, error, request, clear };
};
