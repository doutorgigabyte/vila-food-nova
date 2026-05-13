import { Footprints, Clock } from "lucide-react";
import type { WayfindingRoute } from "./useWayfindingRoute";

interface VilaWayfindingDirectionsProps {
  route: WayfindingRoute;
  destinationName?: string;
}

const formatDistance = (m: number) => {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
};

const formatDuration = (s: number) => {
  const m = Math.round(s / 60);
  if (m < 1) return "menos de 1 min";
  return `${m} min`;
};

/**
 * Lista step-by-step do trajeto. Tambem serve como "modo lista acessivel"
 * (FR-10 do PRD): quem nao quer mapa visual le aqui as instrucoes.
 */
export const VilaWayfindingDirections = ({
  route,
  destinationName,
}: VilaWayfindingDirectionsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg">
        <div className="flex items-center gap-2">
          <Footprints className="w-5 h-5 text-primary" />
          <span className="font-semibold">{formatDistance(route.totalDistanceMeters)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span className="font-semibold">{formatDuration(route.totalDurationSeconds)}</span>
        </div>
        {destinationName && (
          <span className="ml-auto text-sm text-muted-foreground truncate">
            ate {destinationName}
          </span>
        )}
      </div>

      <ol
        className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1"
        aria-label="Instrucoes passo a passo"
      >
        {route.steps.map((step, idx) => (
          <li
            key={idx}
            className="flex gap-3 p-3 rounded-lg border border-border bg-card"
          >
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex-shrink-0 flex items-center justify-center text-sm font-semibold">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{step.instruction}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistance(step.distanceMeters)} · {formatDuration(step.durationSeconds)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
