/**
 * Types compartilhados pelos templates V2 do Vilatok TV.
 * Mantem o contrato com TVSlidePlayer.tsx (mesma shape do TVSlide do legado).
 */

export interface TVSlideTemplateData {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  product_id: string | null;
  template_type: string;
  badge_text?: string | null;
  secondary_images?: string[];
  media_type?: string;
  duration_seconds?: number;
  image_scale?: number;
  image_position_x?: number;
  image_position_y?: number;
  product?: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
  } | null;
}

export interface TVSlideTemplateEstablishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  whatsapp: string | null;
}

export interface TVSlideTemplateProps {
  slide: TVSlideTemplateData;
  establishment: TVSlideTemplateEstablishment;
  /** Se true, ativa entrada animada. Caller controla isso via key/AnimatePresence. */
  isActive: boolean;
}

/**
 * Slugs dos novos templates. Salve estes no campo `template_type` no
 * cadastro do slide via /admin ou /painel/:slug/vilatok-tv.
 */
export const TEMPLATE_SLUGS_V2 = {
  HERO_BANNER: "v2-hero-banner",
  PRODUCT_SHOWCASE: "v2-product-showcase",
  STORY_QUOTE: "v2-story-quote",
} as const;

export type TemplateSlugV2 = (typeof TEMPLATE_SLUGS_V2)[keyof typeof TEMPLATE_SLUGS_V2];

export const formatPrice = (value: number): string =>
  value.toFixed(2).replace(".", ",");
