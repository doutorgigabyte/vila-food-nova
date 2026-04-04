import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  initAnalytics, 
  trackAddToCart, 
  trackPurchase, 
  trackViewContent, 
  trackInitiateCheckout,
  trackSearch,
  trackPageView,
  trackLead
} from '@/lib/analytics';

interface UseAnalyticsConfig {
  establishmentId?: string;
  autoInit?: boolean;
}

export const useAnalytics = ({ establishmentId, autoInit = true }: UseAnalyticsConfig = {}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState<{
    facebookPixelId?: string;
    googleAnalyticsId?: string;
    tiktokPixelId?: string;
    isActive: boolean;
  } | null>(null);

  // Fetch analytics config for establishment
  useEffect(() => {
    if (!establishmentId || !autoInit) return;

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('analytics_pixels')
          .select('*')
          .eq('establishment_id', establishmentId)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('[Analytics] Error fetching config:', error);
          return;
        }

        if (data) {
          setConfig({
            facebookPixelId: data.facebook_pixel_id || undefined,
            googleAnalyticsId: data.google_analytics_id || undefined,
            tiktokPixelId: data.tiktok_pixel_id || undefined,
            isActive: data.is_active
          });
        }
      } catch (err) {
        console.error('[Analytics] Error:', err);
      }
    };

    fetchConfig();
  }, [establishmentId, autoInit]);

  // Initialize pixels when config is available
  useEffect(() => {
    if (!config || !config.isActive || isInitialized) return;

    initAnalytics({
      facebookPixelId: config.facebookPixelId,
      googleAnalyticsId: config.googleAnalyticsId,
      tiktokPixelId: config.tiktokPixelId
    });

    setIsInitialized(true);
    console.log('[Analytics] Initialized with config:', {
      fb: !!config.facebookPixelId,
      ga: !!config.googleAnalyticsId,
      tt: !!config.tiktokPixelId
    });
  }, [config, isInitialized]);

  // Wrapped event functions
  const trackProductView = useCallback((product: {
    id: string;
    name: string;
    price: number;
    category?: string;
  }) => {
    if (!isInitialized) return;
    trackViewContent(product);
    console.log('[Analytics] ViewContent:', product.name);
  }, [isInitialized]);

  const trackAddToCartEvent = useCallback((item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }) => {
    if (!isInitialized) return;
    trackAddToCart(item);
    console.log('[Analytics] AddToCart:', item.name, 'x', item.quantity);
  }, [isInitialized]);

  const trackCheckoutStart = useCallback((items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>, total: number) => {
    if (!isInitialized) return;
    trackInitiateCheckout(items, total);
    console.log('[Analytics] InitiateCheckout:', items.length, 'items, total:', total);
  }, [isInitialized]);

  const trackPurchaseComplete = useCallback((orderData: {
    orderId: string;
    total: number;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      category?: string;
    }>;
  }) => {
    if (!isInitialized) return;
    trackPurchase(orderData);
    console.log('[Analytics] Purchase:', orderData.orderId, 'total:', orderData.total);
  }, [isInitialized]);

  const trackSearchEvent = useCallback((searchTerm: string) => {
    if (!isInitialized) return;
    trackSearch(searchTerm);
    console.log('[Analytics] Search:', searchTerm);
  }, [isInitialized]);

  const trackPageViewEvent = useCallback((pageName?: string) => {
    if (!isInitialized) return;
    trackPageView(pageName);
    console.log('[Analytics] PageView:', pageName || 'current');
  }, [isInitialized]);

  const trackLeadEvent = useCallback((source?: string) => {
    if (!isInitialized) return;
    trackLead(source);
    console.log('[Analytics] Lead:', source);
  }, [isInitialized]);

  return {
    isInitialized,
    config,
    trackProductView,
    trackAddToCart: trackAddToCartEvent,
    trackCheckoutStart,
    trackPurchaseComplete,
    trackSearch: trackSearchEvent,
    trackPageView: trackPageViewEvent,
    trackLead: trackLeadEvent
  };
};

export default useAnalytics;
