import { useCallback, useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./loadGoogleMaps";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface WayfindingRoute {
  polyline: LatLng[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  steps: RouteStep[];
  raw: any;
}

export type RouteStatus = "idle" | "calculating" | "ready" | "error";

interface UseWayfindingRouteOptions {
  origin: LatLng | null;
  destination: LatLng | null;
  /** Cache key adicional pra dedup; util quando o mesmo destino e recalculado. */
  cacheKey?: string;
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

/**
 * Calcula rota a pe via Google Directions API.
 * Roda apenas no cliente; faz cache local em memoria por sessao para nao
 * gastar request da mesma origem/destino mais de uma vez.
 */
const routeCache = new Map<string, WayfindingRoute>();

export const useWayfindingRoute = ({
  origin,
  destination,
  cacheKey,
}: UseWayfindingRouteOptions) => {
  const [status, setStatus] = useState<RouteStatus>("idle");
  const [route, setRoute] = useState<WayfindingRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const calculate = useCallback(async () => {
    if (!origin || !destination) {
      setRoute(null);
      setStatus("idle");
      return;
    }

    const key =
      cacheKey ||
      `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}->${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;

    const cached = routeCache.get(key);
    if (cached) {
      setRoute(cached);
      setStatus("ready");
      setError(null);
      return;
    }

    const myReqId = ++reqIdRef.current;
    setStatus("calculating");
    setError(null);

    try {
      await loadGoogleMaps();
      const service = new window.google.maps.DirectionsService();
      const response = await service.route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.WALKING,
      });

      // Ignora se uma requisicao mais recente ja foi disparada.
      if (myReqId !== reqIdRef.current) return;

      const leg = response.routes?.[0]?.legs?.[0];
      if (!leg) throw new Error("Rota nao encontrada");

      const polyline: LatLng[] = response.routes[0].overview_path.map((p: any) => ({
        lat: p.lat(),
        lng: p.lng(),
      }));

      const steps: RouteStep[] = (leg.steps || []).map((s: any) => ({
        instruction: stripHtml(s.instructions || ""),
        distanceMeters: s.distance?.value ?? 0,
        durationSeconds: s.duration?.value ?? 0,
      }));

      const computed: WayfindingRoute = {
        polyline,
        totalDistanceMeters: leg.distance?.value ?? 0,
        totalDurationSeconds: leg.duration?.value ?? 0,
        steps,
        raw: response,
      };

      routeCache.set(key, computed);
      setRoute(computed);
      setStatus("ready");
    } catch (e: any) {
      if (myReqId !== reqIdRef.current) return;
      setStatus("error");
      setError(e?.message || "Falha ao calcular rota");
      setRoute(null);
    }
  }, [origin, destination, cacheKey]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return { status, route, error, recalculate: calculate };
};
