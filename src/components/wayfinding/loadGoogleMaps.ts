import { GOOGLE_MAPS_API_KEY } from "@/lib/constants";

declare global {
  interface Window {
    google: any;
  }
}

let loadingPromise: Promise<void> | null = null;

/**
 * Garante que o script do Google Maps esta carregado (uma unica vez por sessao).
 * Reusa libraries do GoogleMap.tsx (drawing/places/geometry) para evitar conflito
 * de scripts duplicados com libraries diferentes.
 */
export const loadGoogleMaps = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-vt-gmaps="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps load failed")));
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error("VITE_GOOGLE_MAPS_API_KEY not configured"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,places,geometry`;
    script.async = true;
    script.defer = true;
    script.dataset.vtGmaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps load failed"));
    document.head.appendChild(script);
  });

  return loadingPromise;
};
