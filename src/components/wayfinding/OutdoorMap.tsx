import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./loadGoogleMaps";
import type { LatLng, WayfindingRoute } from "./useWayfindingRoute";

export interface OutdoorMapDestination {
  id: string;
  name: string;
  position: LatLng;
  logoUrl?: string | null;
  isHighlighted?: boolean;
}

interface OutdoorMapProps {
  center: LatLng;
  zoom?: number;
  userPosition?: LatLng | null;
  entryPoint?: LatLng | null;
  destinations: OutdoorMapDestination[];
  route?: WayfindingRoute | null;
  onDestinationClick?: (id: string) => void;
  className?: string;
}

/**
 * Mapa especializado para wayfinding outdoor:
 * - User position (azul pulsante)
 * - Entry point (verde, label)
 * - Destinos (pin com logo, custom highlight no selecionado)
 * - Rota (polyline laranja com glow)
 *
 * Carrega o script via loadGoogleMaps() para nao conflitar com o
 * GoogleMap.tsx generico. Limpa todos os overlays ao desmontar.
 */
export const OutdoorMap = ({
  center,
  zoom = 17,
  userPosition,
  entryPoint,
  destinations,
  route,
  onDestinationClick,
  className = "w-full h-full",
}: OutdoorMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyRef = useRef<any>(null);
  const entryMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  // Bootstrap
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;
        setLoaded(true);
      })
      .catch((e) => {
        console.error("[OutdoorMap]", e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Init map
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;
    mapRef.current = new window.google.maps.Map(containerRef.current, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi.business", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [loaded, center, zoom]);

  // User marker
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    userMarkerRef.current?.setMap(null);
    userAccuracyRef.current?.setMap(null);
    if (!userPosition) return;
    userMarkerRef.current = new window.google.maps.Marker({
      position: userPosition,
      map: mapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      title: "Voce esta aqui",
      zIndex: 1000,
    });
    userAccuracyRef.current = new window.google.maps.Circle({
      map: mapRef.current,
      center: userPosition,
      radius: 25,
      fillColor: "#4285F4",
      fillOpacity: 0.12,
      strokeColor: "#4285F4",
      strokeOpacity: 0.35,
      strokeWeight: 1,
    });
  }, [userPosition, loaded]);

  // Entry point marker
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    entryMarkerRef.current?.setMap(null);
    if (!entryPoint) return;
    entryMarkerRef.current = new window.google.maps.Marker({
      position: entryPoint,
      map: mapRef.current,
      label: {
        text: "Entrada",
        color: "#ffffff",
        fontSize: "11px",
        fontWeight: "600",
      },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: "#22c55e",
        fillOpacity: 0.95,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      title: "Entrada da vila",
      zIndex: 900,
    });
  }, [entryPoint, loaded]);

  // Destination markers
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    destinations.forEach((d) => {
      const marker = new window.google.maps.Marker({
        position: d.position,
        map: mapRef.current,
        title: d.name,
        icon: d.logoUrl
          ? {
              url: d.logoUrl,
              scaledSize: new window.google.maps.Size(
                d.isHighlighted ? 48 : 36,
                d.isHighlighted ? 48 : 36
              ),
              anchor: new window.google.maps.Point(
                d.isHighlighted ? 24 : 18,
                d.isHighlighted ? 48 : 36
              ),
            }
          : {
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: d.isHighlighted ? 8 : 6,
              fillColor: d.isHighlighted ? "#FF6B35" : "#1f2937",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
        zIndex: d.isHighlighted ? 800 : 500,
      });
      if (onDestinationClick) {
        marker.addListener("click", () => onDestinationClick(d.id));
      }
      markersRef.current.push(marker);
    });
  }, [destinations, loaded, onDestinationClick]);

  // Route polyline + bounds fit
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    if (!route || route.polyline.length === 0) return;
    polylineRef.current = new window.google.maps.Polyline({
      path: route.polyline,
      geodesic: true,
      strokeColor: "#FF6B35",
      strokeOpacity: 0.95,
      strokeWeight: 6,
      map: mapRef.current,
    });
    const bounds = new window.google.maps.LatLngBounds();
    route.polyline.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 80);
  }, [route, loaded]);

  // Cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.setMap?.(null));
      markersRef.current = [];
      userMarkerRef.current?.setMap?.(null);
      userAccuracyRef.current?.setMap?.(null);
      entryMarkerRef.current?.setMap?.(null);
      polylineRef.current?.setMap?.(null);
    };
  }, []);

  return (
    <div className={`relative ${className}`} aria-label="Mapa da vila com rota a pe">
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted text-muted-foreground">
          Carregando mapa...
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
