import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AICreditsState {
  credits: number;
  hasUnlimited: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useAICredits = (establishmentId: string | null, planId: string | null): AICreditsState => {
  const [credits, setCredits] = useState(0);
  const [hasUnlimited, setHasUnlimited] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!establishmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Check if plan has unlimited AI
      if (planId) {
        const { data: plan } = await supabase
          .from('plans')
          .select('ai_unlimited')
          .eq('id', planId)
          .single();

        setHasUnlimited(plan?.ai_unlimited || false);
      }

      // Get current credits
      const { data: creditData } = await supabase
        .from('ai_credits')
        .select('credits_balance')
        .eq('establishment_id', establishmentId)
        .single();

      setCredits(creditData?.credits_balance || 0);
    } catch (error) {
      console.error('Error fetching AI credits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [establishmentId, planId]);

  return {
    credits,
    hasUnlimited,
    loading,
    refresh: fetchCredits
  };
};

export const deductCredits = async (
  establishmentId: string, 
  amount: number, 
  type: string, 
  description: string
): Promise<boolean> => {
  try {
    // Get current credits
    const { data: current } = await supabase
      .from('ai_credits')
      .select('credits_balance')
      .eq('establishment_id', establishmentId)
      .single();

    const currentBalance = current?.credits_balance || 0;

    if (currentBalance < amount) {
      return false;
    }

    // Update credits
    const { error: updateError } = await supabase
      .from('ai_credits')
      .upsert({
        establishment_id: establishmentId,
        credits_balance: currentBalance - amount,
        last_updated: new Date().toISOString()
      });

    if (updateError) throw updateError;

    // Log transaction
    await supabase.from('ai_transactions').insert({
      establishment_id: establishmentId,
      type,
      description,
      credits_used: amount
    });

    return true;
  } catch (error) {
    console.error('Error deducting credits:', error);
    return false;
  }
};

export const addCredits = async (
  establishmentId: string, 
  amount: number, 
  price: number
): Promise<boolean> => {
  try {
    // Get current credits
    const { data: current } = await supabase
      .from('ai_credits')
      .select('credits_balance')
      .eq('establishment_id', establishmentId)
      .single();

    const currentBalance = current?.credits_balance || 0;

    // Update credits
    const { error: updateError } = await supabase
      .from('ai_credits')
      .upsert({
        establishment_id: establishmentId,
        credits_balance: currentBalance + amount,
        last_updated: new Date().toISOString()
      });

    if (updateError) throw updateError;

    // Log transaction
    await supabase.from('ai_transactions').insert({
      establishment_id: establishmentId,
      type: 'purchase',
      description: `Compra de ${amount} créditos`,
      credits_used: -amount, // Negative for purchases
      price
    });

    return true;
  } catch (error) {
    console.error('Error adding credits:', error);
    return false;
  }
};