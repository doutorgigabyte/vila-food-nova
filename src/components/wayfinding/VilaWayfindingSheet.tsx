import { useEffect, useMemo, useState } from "react";
import { Navigation, MapPin, List, Map as MapIcon, Locate, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Vila, VilaEstablishment } from "@/hooks/useVilas";
import {
  trackWayfindingOpen,
  trackWayfindingRouteCalculated,
} from "@/lib/analytics";
import { OutdoorMap, type OutdoorMapDestination } from "./OutdoorMap";
import { VilaWayfindingDestinationList } from "./VilaWayfindingDestinationList";
import { VilaWayfindingDirections } from "./VilaWayfindingDirections";
import { useUserPosition } from "./useUserPosition";
import { useWayfindingRoute, type LatLng } from "./useWayfindingRoute";

interface VilaWayfindingSheetProps {
  vila: Vila;
  establishments: VilaEstablishment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Permite abrir o sheet ja com um destino selecionado (deep link). */
  initialDestinationId?: string | null;
}

type ViewMode = "map" | "list";

/**
 * Sheet de wayfinding outdoor.
 *
 * Fluxo:
 * 1. Usuario abre o sheet -> rastreado em `wayfinding_open`
 * 2. Ve mapa com pin de cada estabelecimento da vila
 * 3. Seleciona destino (pin ou lista lateral)
 * 4. Sheet calcula rota a pe (origem = GPS ou entrada padrao da vila)
 * 5. Polyline desenhada + tabela de instrucoes turn-by-turn
 *
 * Acessibilidade: toggle "Mapa | Lista" da fallback completo via VilaWayfindingDirections.
 */
export const VilaWayfindingSheet = ({
  vila,
  establishments,
  open,
  onOpenChange,
  initialDestinationId = null,
}: VilaWayfindingSheetProps) => {
  const [view, setView] = useState<ViewMode>("map");
  const [selectedId, setSelectedId] = useState<string | null>(initialDestinationId);
  const { position, permission, request, error: gpsError } = useUserPosition();

  // Dispara tracking + reseta selecao ao abrir
  useEffect(() => {
    if (open) {
      trackWayfindingOpen(vila.slug, "vila_page");
      setSelectedId(initialDestinationId);
    }
  }, [open, vila.slug, initialDestinationId]);

  // Estabelecimentos com coordenadas validas (precisamos pra desenhar)
  const geocoded = useMemo(
    () =>
      establishments.filter(
        (e) => typeof e.latitude === "number" && typeof e.longitude === "number"
      ),
    [establishments]
  );

  // Centro: prefere centroide dos estabelecimentos; se nao houver, lat/lng da vila;
  // fallback final: Tamandare-PE (mesmo default do GoogleMap.tsx).
  const center: LatLng = useMemo(() => {
    if (geocoded.length > 0) {
      const sumLat = geocoded.reduce((acc, e) => acc + (e.latitude ?? 0), 0);
      const sumLng = geocoded.reduce((acc, e) => acc + (e.longitude ?? 0), 0);
      return { lat: sumLat / geocoded.length, lng: sumLng / geocoded.length };
    }
    if (typeof vila.latitude === "number" && typeof vila.longitude === "number") {
      return { lat: vila.latitude, lng: vila.longitude };
    }
    return { lat: -8.7614, lng: -35.1087 };
  }, [geocoded, vila.latitude, vila.longitude]);

  // Origem da rota: GPS > entrada padrao > centroide
  const origin: LatLng | null = useMemo(() => {
    if (position) return { lat: position.lat, lng: position.lng };
    if (vila.default_entry_point) {
      return { lat: vila.default_entry_point.lat, lng: vila.default_entry_point.lng };
    }
    return null;
  }, [position, vila.default_entry_point]);

  const originLabel =
    permission === "granted"
      ? "Saindo da sua localizacao"
      : vila.default_entry_point?.label
      ? `Saindo da ${vila.default_entry_point.label}`
      : "Saindo do centro da vila";

  const selected = useMemo(
    () => geocoded.find((e) => e.id === selectedId) || null,
    [geocoded, selectedId]
  );

  const destination: LatLng | null = useMemo(() => {
    if (!selected || selected.latitude === null || selected.longitude === null) return null;
    return { lat: selected.latitude, lng: selected.longitude };
  }, [selected]);

  // Calcula a rota quando origem + destino existem
  const fallbackOrigin: LatLng | null = origin ?? (vila.default_entry_point ? null : center);
  const { route, status, error } = useWayfindingRoute({
    origin: origin ?? fallbackOrigin,
    destination,
  });

  // Tracking de rota calculada
  useEffect(() => {
    if (status === "ready" && route && selected) {
      trackWayfindingRouteCalculated(vila.slug, selected.id, route.totalDistanceMeters);
    }
  }, [status, route, selected, vila.slug]);

  const mapDestinations: OutdoorMapDestination[] = useMemo(
    () =>
      geocoded.map((e) => ({
        id: e.id,
        name: e.name,
        position: { lat: e.latitude!, lng: e.longitude! },
        logoUrl: e.logo_url,
        isHighlighted: e.id === selectedId,
      })),
    [geocoded, selectedId]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] sm:h-[88vh] p-0 flex flex-col gap-0 max-w-full sm:max-w-full"
      >
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-5 h-5 text-primary" />
              Como chegar — {vila.name}
            </SheetTitle>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                type="button"
                variant={view === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("map")}
                aria-label="Visualizar mapa"
                aria-pressed={view === "map"}
              >
                <MapIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                aria-label="Visualizar lista"
                aria-pressed={view === "list"}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            <Badge variant="outline" className="text-xs">
              <Navigation className="w-3 h-3 mr-1" />
              {originLabel}
            </Badge>
            {permission !== "granted" && permission !== "unavailable" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={request}
                className="h-7 text-xs"
              >
                <Locate className="w-3 h-3 mr-1" />
                {permission === "requesting" ? "Localizando..." : "Usar minha localizacao"}
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_360px] overflow-hidden">
          <div className="relative bg-muted min-h-[280px] md:min-h-0 order-2 md:order-1">
            {view === "map" ? (
              <OutdoorMap
                center={center}
                userPosition={position ? { lat: position.lat, lng: position.lng } : null}
                entryPoint={
                  vila.default_entry_point
                    ? { lat: vila.default_entry_point.lat, lng: vila.default_entry_point.lng }
                    : null
                }
                destinations={mapDestinations}
                route={route}
                onDestinationClick={setSelectedId}
              />
            ) : (
              <div className="p-4 h-full overflow-y-auto">
                {route ? (
                  <VilaWayfindingDirections route={route} destinationName={selected?.name} />
                ) : selected ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {status === "calculating" ? "Calculando rota..." : "Selecione um destino no mapa."}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Selecione um estabelecimento na lista para ver as instrucoes.
                  </div>
                )}
              </div>
            )}

            {gpsError && permission === "denied" && view === "map" && (
              <div className="absolute top-3 left-3 right-3 md:right-auto md:max-w-sm flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Sem permissao de GPS — usando {vila.default_entry_point?.label || "centro da vila"} como ponto de partida.
                </span>
              </div>
            )}

            {status === "error" && error && (
              <div className="absolute bottom-3 left-3 right-3 md:max-w-sm flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/40 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <aside className="border-t md:border-t-0 md:border-l p-4 overflow-y-auto order-1 md:order-2">
            <VilaWayfindingDestinationList
              establishments={establishments}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            {selected && route && view === "map" && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold mb-2">Trajeto resumido</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Toque em "Lista" no topo para ver passo a passo.
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="secondary">
                    {Math.round(route.totalDistanceMeters)} m
                  </Badge>
                  <Badge variant="secondary">
                    {Math.round(route.totalDurationSeconds / 60)} min a pe
                  </Badge>
                </div>
              </div>
            )}
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
};
