// Analytics platform-level para a landing page (/conheca, /, etc.).
// Diferente de `src/lib/analytics.ts` (que e per-establishment via tabela
// `analytics_pixels`), este modulo usa env vars `VITE_GA_MEASUREMENT_ID` e
// `VITE_FACEBOOK_PIXEL_ID` para o site institucional.
//
// LGPD: so dispara quando o usuario aceitou consent.level === 'all'.
// Sem consent ou apenas 'essential', tudo vira no-op.

import { initAnalytics, trackPageView, trackLead } from "@/lib/analytics";
import { readConsent } from "@/components/CookieConsentBanner";

let initialized = false;

function getPlatformConfig() {
  return {
    googleAnalyticsId: import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined,
    facebookPixelId: import.meta.env.VITE_FACEBOOK_PIXEL_ID as string | undefined,
  };
}

function consentAllowsTracking(): boolean {
  return readConsent()?.level === "all";
}

export function initPlatformAnalytics(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!consentAllowsTracking()) return;

  const cfg = getPlatformConfig();
  if (!cfg.googleAnalyticsId && !cfg.facebookPixelId) return;

  initAnalytics(cfg);
  initialized = true;
}

// Helper interno: roda fn so se inicializado e gtag existir.
function ifTracking(fn: (gtag: (...args: unknown[]) => void) => void) {
  if (!consentAllowsTracking()) return;
  if (!initialized) initPlatformAnalytics();
  if (typeof window === "undefined" || !window.gtag) return;
  fn(window.gtag);
}

// ============================================================
// Eventos de landing page
// ============================================================

export function trackLandingPageView(pageName: string): void {
  if (!consentAllowsTracking()) return;
  if (!initialized) initPlatformAnalytics();
  trackPageView(pageName);
}

export function trackSectionView(sectionId: string): void {
  ifTracking((gtag) => {
    gtag("event", "section_view", {
      event_category: "landing_engagement",
      section_id: sectionId,
    });
  });
}

export function trackCTAClick(params: {
  ctaText: string;
  ctaLocation: string;
  destination?: string;
}): void {
  ifTracking((gtag) => {
    gtag("event", "cta_clicked", {
      event_category: "landing_conversion",
      cta_text: params.ctaText,
      cta_location: params.ctaLocation,
      destination: params.destination,
    });
  });
}

export function trackCalculatorStarted(revenueBracket?: string): void {
  ifTracking((gtag) => {
    gtag("event", "calculator_started", {
      event_category: "landing_engagement",
      revenue_bracket: revenueBracket,
    });
  });
}

export function trackCalculatorCompleted(params: {
  revenue: number;
  deliveryType: "own" | "ifood";
  estimatedSavings: number;
}): void {
  ifTracking((gtag) => {
    gtag("event", "calculator_completed", {
      event_category: "landing_conversion",
      revenue: params.revenue,
      delivery_type: params.deliveryType,
      estimated_savings: params.estimatedSavings,
      value: params.estimatedSavings,
      currency: "BRL",
    });
  });
}

export function trackPricingPlanSelected(params: {
  planName: string;
  billingCycle: "monthly" | "yearly";
  price: number;
}): void {
  ifTracking((gtag) => {
    gtag("event", "pricing_plan_selected", {
      event_category: "landing_conversion",
      plan_name: params.planName,
      billing_cycle: params.billingCycle,
      value: params.price,
      currency: "BRL",
    });
  });
}

export function trackFAQOpened(question: string): void {
  ifTracking((gtag) => {
    gtag("event", "faq_opened", {
      event_category: "landing_engagement",
      question: question.slice(0, 100),
    });
  });
}

export function trackSignupIntent(source: string): void {
  if (!consentAllowsTracking()) return;
  if (!initialized) initPlatformAnalytics();
  // Sinaliza intencao de signup imediatamente antes do navigate.
  // Usa trackLead (compativel com FB Pixel + GA `generate_lead`) + evento
  // dedicado pra funil de landing.
  trackLead(source);
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "signup_intent", {
      event_category: "landing_conversion",
      source,
    });
  }
}
