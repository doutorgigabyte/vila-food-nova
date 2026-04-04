// Domain configuration
export const DOMAIN = 'vilafood.delivery';
export const SUBDOMAIN_SUFFIX = '.vilafood.delivery';
export const SUPPORT_EMAIL = 'suporte@vilafood.delivery';
export const ADMIN_EMAIL = 'admin@vilafood.delivery';

// Google Maps API Key (public/client-side key)
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// App configuration
export const APP_NAME = 'VilaFood';
export const APP_DESCRIPTION = 'Plataforma de cardápio digital e delivery';

// URL helpers
export const getStoreUrl = (slug: string) => `https://${slug}${SUBDOMAIN_SUFFIX}`;
export const getReferralUrl = (code: string) => `https://${DOMAIN}/r/${code}`;
export const getMarketplaceUrl = () => `https://${DOMAIN}`;
