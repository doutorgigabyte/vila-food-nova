import { useCallback, useEffect, useRef } from "react";
import {
  initPlatformAnalytics,
  trackLandingPageView,
  trackSectionView,
  trackCTAClick,
  trackCalculatorStarted,
  trackCalculatorCompleted,
  trackPricingPlanSelected,
  trackFAQOpened,
  trackSignupIntent,
} from "@/lib/landingAnalytics";

/**
 * Hook para componentes da landing page consumirem analytics.
 * Inicializa o GA4 platform-level no mount e expoe os event helpers.
 *
 * O proprio modulo de analytics ja gateia por consent LGPD — se o usuario
 * nao aceitou ou aceitou apenas 'essential', tudo vira no-op silencioso.
 */
export function useLandingAnalytics(pageName?: string) {
  useEffect(() => {
    initPlatformAnalytics();
    if (pageName) trackLandingPageView(pageName);
  }, [pageName]);

  return {
    trackSectionView,
    trackCTAClick,
    trackCalculatorStarted,
    trackCalculatorCompleted,
    trackPricingPlanSelected,
    trackFAQOpened,
    trackSignupIntent,
  };
}

/**
 * Dispara `section_view` quando o elemento entra na viewport (>=50% visivel).
 * Dispara apenas UMA vez por mount.
 */
export function useSectionView(sectionId: string) {
  const ref = useRef<HTMLElement | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!ref.current || fired.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            trackSectionView(sectionId);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId]);

  return ref;
}
