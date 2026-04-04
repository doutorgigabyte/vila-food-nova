import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import { CheckCircle, MessageSquare } from 'lucide-react';

interface ReviewCardProps {
  review: {
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
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const customerName = review.customer?.name || 'Cliente';
  const initials = customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="border-b border-border pb-4 last:border-0">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={review.customer?.avatar_url} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{customerName}</span>
            {review.is_verified_purchase && (
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckCircle className="w-3 h-3" />
                Compra verificada
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <StarRating value={review.overall_rating} readonly size="sm" />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>

          {/* Detailed ratings */}
          {(review.food_rating || review.delivery_rating || review.service_rating) && (
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              {review.food_rating && (
                <span>Comida: {review.food_rating}★</span>
              )}
              {review.delivery_rating && (
                <span>Entrega: {review.delivery_rating}★</span>
              )}
              {review.service_rating && (
                <span>Atendimento: {review.service_rating}★</span>
              )}
            </div>
          )}

          {/* Selected Tags */}
          {review.selected_tags && review.selected_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(review.selected_tags as string[]).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Comment */}
          {review.comment && (
            <p className="mt-2 text-sm text-foreground/90">{review.comment}</p>
          )}

          {/* Photos */}
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mt-3">
              {(review.photos as string[]).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Foto ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Owner response */}
          {review.owner_response && (
            <div className="mt-3 bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <MessageSquare className="w-4 h-4" />
                Resposta do estabelecimento
              </div>
              <p className="text-sm text-muted-foreground">{review.owner_response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
