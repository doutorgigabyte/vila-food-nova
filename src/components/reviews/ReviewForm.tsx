import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StarRating } from './StarRating';
import { ImageUpload } from '@/components/ImageUpload';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send } from 'lucide-react';

interface ReviewFormProps {
  orderId: string;
  establishmentId: string;
  establishmentName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ 
  orderId, 
  establishmentId, 
  establishmentName,
  onSuccess,
  onCancel 
}: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error('Por favor, dê uma avaliação geral');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('reviews').insert({
        order_id: orderId,
        establishment_id: establishmentId,
        user_id: user?.id || null,
        overall_rating: overallRating,
        food_rating: foodRating || null,
        delivery_rating: deliveryRating || null,
        service_rating: serviceRating || null,
        comment: comment || null,
        photos: photos.length > 0 ? photos : [],
        is_verified_purchase: true,
      });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Erro ao enviar avaliação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Avalie seu pedido</CardTitle>
        <p className="text-muted-foreground text-sm">{establishmentName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="space-y-2 text-center">
          <Label className="text-base font-medium">Como foi sua experiência?</Label>
          <div className="flex justify-center">
            <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
          </div>
        </div>

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1 text-center">
            <Label className="text-sm text-muted-foreground">Comida</Label>
            <div className="flex justify-center">
              <StarRating value={foodRating} onChange={setFoodRating} size="sm" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <Label className="text-sm text-muted-foreground">Entrega</Label>
            <div className="flex justify-center">
              <StarRating value={deliveryRating} onChange={setDeliveryRating} size="sm" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <Label className="text-sm text-muted-foreground">Atendimento</Label>
            <div className="flex justify-center">
              <StarRating value={serviceRating} onChange={setServiceRating} size="sm" />
            </div>
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label>Conte mais sobre sua experiência (opcional)</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que você achou do pedido?"
            rows={4}
          />
        </div>

        {/* Photos */}
        <div className="space-y-2">
          <Label>Adicionar fotos (opcional)</Label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative w-20 h-20">
                <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <ImageUpload
                bucket="products"
                onUpload={(url) => setPhotos([...photos, url])}
                className="w-20 h-20"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || overallRating === 0}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar avaliação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
