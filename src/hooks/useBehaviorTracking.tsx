import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

// Generate or get session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('behavior_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('behavior_session_id', sessionId);
  }
  return sessionId;
};

// Get randomization seed for fair product distribution
export const getRandomizationSeed = (): number => {
  let seed = sessionStorage.getItem('product_shuffle_seed');
  if (!seed) {
    seed = Math.random().toString();
    sessionStorage.setItem('product_shuffle_seed', seed);
  }
  return parseFloat(seed);
};

// Seeded random number generator for consistent shuffling within session
export const seededRandom = (seed: number, index: number): number => {
  const x = Math.sin(seed * 9999 + index) * 10000;
  return x - Math.floor(x);
};

type ActionType = 'view' | 'click' | 'add_to_cart' | 'purchase' | 'search';
type EntityType = 'product' | 'establishment' | 'category' | 'vila';

interface TrackingMetadata {
  query?: string;
  results_count?: number;
  category_id?: string;
  establishment_id?: string;
  price?: number;
  promotional_price?: number;
  [key: string]: string | number | boolean | undefined;
}

export const useBehaviorTracking = () => {
  const { user } = useAuth();
  const sessionId = useRef(getSessionId());
  const trackedViews = useRef<Set<string>>(new Set());

  // Reset tracked views when session changes
  useEffect(() => {
    sessionId.current = getSessionId();
    trackedViews.current.clear();
  }, []);

  const trackAction = useCallback(async (
    actionType: ActionType,
    entityType?: EntityType,
    entityId?: string,
    metadata?: TrackingMetadata
  ) => {
    try {
      // Avoid duplicate view tracking in same session
      if (actionType === 'view' && entityId) {
        const viewKey = `${entityType}_${entityId}`;
        if (trackedViews.current.has(viewKey)) {
          return;
        }
        trackedViews.current.add(viewKey);
      }

      const insertData: {
        session_id: string;
        action_type: string;
        user_id?: string;
        entity_type?: string;
        entity_id?: string;
        metadata?: Json;
      } = {
        session_id: sessionId.current,
        action_type: actionType,
      };

      if (user?.id) {
        insertData.user_id = user.id;
      }
      if (entityType) {
        insertData.entity_type = entityType;
      }
      if (entityId) {
        insertData.entity_id = entityId;
      }
      if (metadata) {
        // Convert metadata to Json-compatible format by removing undefined values
        const cleanMetadata: Record<string, string | number | boolean> = {};
        Object.entries(metadata).forEach(([key, value]) => {
          if (value !== undefined) {
            cleanMetadata[key] = value;
          }
        });
        insertData.metadata = cleanMetadata as Json;
      }

      await supabase.from('user_behavior_logs').insert([insertData]);
    } catch (error) {
      // Silent fail - don't interrupt user experience
      console.error('Error tracking behavior:', error);
    }
  }, [user?.id]);

  const trackProductView = useCallback((productId: string, metadata?: TrackingMetadata) => {
    trackAction('view', 'product', productId, metadata);
  }, [trackAction]);

  const trackProductClick = useCallback((productId: string, metadata?: TrackingMetadata) => {
    trackAction('click', 'product', productId, metadata);
  }, [trackAction]);

  const trackAddToCart = useCallback((productId: string, metadata?: TrackingMetadata) => {
    trackAction('add_to_cart', 'product', productId, metadata);
  }, [trackAction]);

  const trackPurchase = useCallback((productId: string, metadata?: TrackingMetadata) => {
    trackAction('purchase', 'product', productId, metadata);
  }, [trackAction]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackAction('search', undefined, undefined, { query, results_count: resultsCount });
  }, [trackAction]);

  const trackEstablishmentView = useCallback((establishmentId: string, metadata?: TrackingMetadata) => {
    trackAction('view', 'establishment', establishmentId, metadata);
  }, [trackAction]);

  const trackEstablishmentClick = useCallback((establishmentId: string, metadata?: TrackingMetadata) => {
    trackAction('click', 'establishment', establishmentId, metadata);
  }, [trackAction]);

  const trackCategoryClick = useCallback((categoryId: string, metadata?: TrackingMetadata) => {
    trackAction('click', 'category', categoryId, metadata);
  }, [trackAction]);

  return {
    trackProductView,
    trackProductClick,
    trackAddToCart,
    trackPurchase,
    trackSearch,
    trackEstablishmentView,
    trackEstablishmentClick,
    trackCategoryClick,
    trackAction
  };
};

export default useBehaviorTracking;
