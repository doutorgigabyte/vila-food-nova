import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Json } from '@/integrations/supabase/types';

interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

interface AbandonedCartData {
  items: CartItem[];
  total: number;
  establishmentId: string;
  customerPhone?: string;
  customerName?: string;
}

// Timeout for cart abandonment detection (default 5 minutes)
const ABANDONMENT_TIMEOUT = 5 * 60 * 1000;

export function useAbandonedCartDetection(cartData: AbandonedCartData | null) {
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only track if there are items and we have establishment info
    if (!cartData || cartData.items.length === 0 || !cartData.establishmentId) {
      return;
    }

    // Generate a hash of cart contents to avoid duplicate saves
    const cartHash = JSON.stringify({
      items: cartData.items.map(i => ({ n: i.name, q: i.quantity })),
      total: cartData.total,
    });

    // If cart hasn't changed, don't set a new timeout
    if (cartHash === lastSavedRef.current) {
      return;
    }

    // Set timeout to detect abandonment
    timeoutRef.current = setTimeout(async () => {
      try {
        // Check if user has phone (from profile or local storage)
        let customerPhone = cartData.customerPhone;
        let customerName = cartData.customerName;

        // Try to get from user profile if logged in
        if (user && !customerPhone) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone, full_name')
            .eq('id', user.id)
            .single();

          if (profile) {
            customerPhone = profile.phone || undefined;
            customerName = profile.full_name || undefined;
          }
        }

        // Only save if we have a phone number
        if (!customerPhone) {
          console.log('No phone number available for abandoned cart tracking');
          return;
        }

        // Check if cart already exists for this phone/establishment
        const { data: existing } = await supabase
          .from('abandoned_carts')
          .select('id')
          .eq('establishment_id', cartData.establishmentId)
          .eq('customer_phone', customerPhone)
          .eq('recovered', false)
          .single();

        if (existing) {
          // Update existing cart
          await supabase
            .from('abandoned_carts')
            .update({
              items: JSON.parse(JSON.stringify(cartData.items)) as Json,
              total: cartData.total,
              customer_name: customerName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          // Create new abandoned cart record
          const insertData = {
            establishment_id: cartData.establishmentId,
            customer_phone: customerPhone,
            customer_name: customerName,
            items: JSON.parse(JSON.stringify(cartData.items)) as Json,
            total: cartData.total,
            recovered: false,
            recovery_attempts: 0,
          };
          
          await supabase
            .from('abandoned_carts')
            .insert(insertData);
        }

        lastSavedRef.current = cartHash;
        console.log('Abandoned cart saved for recovery');
      } catch (error) {
        console.error('Error saving abandoned cart:', error);
      }
    }, ABANDONMENT_TIMEOUT);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cartData, user]);

  // Function to mark cart as recovered (call after successful checkout)
  const markCartRecovered = async (customerPhone: string, establishmentId: string) => {
    try {
      await supabase
        .from('abandoned_carts')
        .update({ recovered: true })
        .eq('establishment_id', establishmentId)
        .eq('customer_phone', customerPhone)
        .eq('recovered', false);
      
      lastSavedRef.current = null;
    } catch (error) {
      console.error('Error marking cart as recovered:', error);
    }
  };

  return { markCartRecovered };
}
