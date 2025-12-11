import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AFFILIATE_REF_KEY = 'vilafood_affiliate_ref';

export function useAffiliateTracking() {
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  // Capture affiliate code from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Store in localStorage for persistence
      localStorage.setItem(AFFILIATE_REF_KEY, refCode);
      
      // Fetch affiliate ID from code
      fetchAffiliateByCode(refCode);
    } else {
      // Check if we have a stored ref
      const storedRef = localStorage.getItem(AFFILIATE_REF_KEY);
      if (storedRef) {
        fetchAffiliateByCode(storedRef);
      }
    }
  }, []);

  const fetchAffiliateByCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setAffiliateId(data.id);
      }
    } catch (err) {
      console.error('Error fetching affiliate:', err);
    }
  };

  // Link customer to affiliate when order is created
  const linkCustomerToAffiliate = async (customerId: string) => {
    if (!affiliateId) return false;

    try {
      const { error } = await supabase
        .from('customers')
        .update({ referred_by_affiliate_id: affiliateId })
        .eq('id', customerId)
        .is('referred_by_affiliate_id', null); // Only update if not already referred

      if (!error) {
        // Clear stored ref after successful link
        localStorage.removeItem(AFFILIATE_REF_KEY);
        return true;
      }
    } catch (err) {
      console.error('Error linking customer to affiliate:', err);
    }
    return false;
  };

  const getStoredAffiliateCode = () => {
    return localStorage.getItem(AFFILIATE_REF_KEY);
  };

  const clearAffiliateTracking = () => {
    localStorage.removeItem(AFFILIATE_REF_KEY);
    setAffiliateId(null);
  };

  return {
    affiliateId,
    hasAffiliateRef: !!affiliateId,
    linkCustomerToAffiliate,
    getStoredAffiliateCode,
    clearAffiliateTracking,
  };
}
