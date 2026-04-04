import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReviewCard } from './ReviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MessageSquareOff } from 'lucide-react';
import { StarRating } from './StarRating';

interface ReviewsListProps {
  establishmentId: string;
  limit?: number;
}

interface Review {
  id: string;
  overall_rating: number;
  food_rating?: number;
  delivery_rating?: number;
  service_rating?: number;
  comment?: string;
  photos?: string[];
  selected_tags?: string[];
  owner_response?: string;
  owner_response_at?: string;
  is_verified_purchase?: boolean;
  created_at: string;
  customer?: {
    name?: string;
    avatar_url?: string;
  };
}

export function ReviewsList({ establishmentId, limit }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, count: 0, distribution: [0, 0, 0, 0, 0] });

  useEffect(() => {
    fetchReviews();
  }, [establishmentId]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          customer:customers(name)
        `)
        .eq('establishment_id', establishmentId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Cast photos and selected_tags from Json to string[]
      const reviewsWithTypedPhotos = (data || []).map(review => ({
        ...review,
        photos: review.photos as string[] | undefined,
        selected_tags: review.selected_tags as string[] | undefined
      }));

      setReviews(reviewsWithTypedPhotos);

      // Calculate stats
      if (data && data.length > 0) {
        const total = data.length;
        const sum = data.reduce((acc, r) => acc + r.overall_rating, 0);
        const distribution = [0, 0, 0, 0, 0];
        data.forEach(r => {
          distribution[r.overall_rating - 1]++;
        });

        setStats({
          average: sum / total,
          count: total,
          distribution,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquareOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Ainda não há avaliações</p>
        <p className="text-sm text-muted-foreground/70">Seja o primeiro a avaliar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.average.toFixed(1)}</div>
            <StarRating value={Math.round(stats.average)} readonly size="sm" />
            <div className="text-sm text-muted-foreground mt-1">
              {stats.count} {stats.count === 1 ? 'avaliação' : 'avaliações'}
            </div>
          </div>

          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats.distribution[star - 1];
              const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-4">{star}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-muted-foreground text-xs">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
