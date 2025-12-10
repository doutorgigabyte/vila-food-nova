import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Review {
  id: string;
  order_id?: string;
  establishment_id: string;
  customer_id?: string;
  user_id?: string;
  overall_rating: number;
  food_rating?: number;
  delivery_rating?: number;
  service_rating?: number;
  comment?: string;
  photos?: string[];
  selected_tags?: string[];
  rating_scale?: number;
  owner_response?: string;
  owner_response_at?: string;
  is_visible: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  customer?: {
    name?: string;
  };
  order?: {
    order_number?: number;
  };
}

export function useReviews(establishmentId?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    count: 0,
    distribution: [0, 0, 0, 0, 0],
    pendingResponses: 0,
  });

  const fetchReviews = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:customers(name),
          order:orders(order_number)
        `)
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedReviews = (data || []).map(r => ({
        ...r,
        photos: r.photos as string[] | undefined,
        selected_tags: r.selected_tags as string[] | undefined,
      }));

      setReviews(typedReviews);

      // Calculate stats
      const visible = typedReviews.filter(r => r.is_visible);
      if (visible.length > 0) {
        const sum = visible.reduce((acc, r) => acc + r.overall_rating, 0);
        const distribution = [0, 0, 0, 0, 0];
        visible.forEach(r => {
          distribution[r.overall_rating - 1]++;
        });
        const pendingResponses = visible.filter(r => !r.owner_response).length;

        setStats({
          average: sum / visible.length,
          count: visible.length,
          distribution,
          pendingResponses,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const respondToReview = async (reviewId: string, response: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          owner_response: response,
          owner_response_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Resposta enviada!');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao responder');
    }
  };

  const toggleVisibility = async (reviewId: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_visible: isVisible })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success(isVisible ? 'Avaliação visível' : 'Avaliação ocultada');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
    }
  };

  return {
    reviews,
    loading,
    stats,
    refetch: fetchReviews,
    respondToReview,
    toggleVisibility,
  };
}
