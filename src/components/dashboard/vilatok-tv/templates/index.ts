import type { ComponentType } from "react";
import { HeroBannerTemplate } from "./HeroBannerTemplate";
import { ProductShowcaseTemplate } from "./ProductShowcaseTemplate";
import { StoryQuoteTemplate } from "./StoryQuoteTemplate";
import { TEMPLATE_SLUGS_V2, type TVSlideTemplateProps } from "./types";

export { HeroBannerTemplate, ProductShowcaseTemplate, StoryQuoteTemplate };
export { TEMPLATE_SLUGS_V2 } from "./types";
export type { TVSlideTemplateProps, TVSlideTemplateData, TVSlideTemplateEstablishment } from "./types";

/**
 * Registry dos novos templates V2. Use em TVSlidePlayer.tsx:
 *
 *   const TemplateComponent = TEMPLATE_REGISTRY_V2[slide.template_type];
 *   if (TemplateComponent) {
 *     return <TemplateComponent slide={slide} establishment={est} isActive={...} />;
 *   }
 *
 * Se template_type nao existir aqui, mantenha o fallback nos templates V1
 * (TVSlidePlayer ja tem 30+ template_types legados).
 */
export const TEMPLATE_REGISTRY_V2: Record<string, ComponentType<TVSlideTemplateProps>> = {
  [TEMPLATE_SLUGS_V2.HERO_BANNER]: HeroBannerTemplate,
  [TEMPLATE_SLUGS_V2.PRODUCT_SHOWCASE]: ProductShowcaseTemplate,
  [TEMPLATE_SLUGS_V2.STORY_QUOTE]: StoryQuoteTemplate,
};
