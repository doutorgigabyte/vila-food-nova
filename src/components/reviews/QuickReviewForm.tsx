import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, Package, Truck, Store, Smartphone } from 'lucide-react';
import QuickRatingScale from './QuickRatingScale';
import RatingTags from './RatingTags';

interface QuickReviewFormProps {
  orderId: string;
  establishmentId: string;
  establishmentName: string;
  hasDelivery?: boolean;
  isMarketplace?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type Step = 'product' | 'delivery' | 'establishment' | 'platform' | 'comment' | 'done';

const QuickReviewForm = ({
  orderId,
  establishmentId,
  establishmentName,
  hasDelivery = true,
  isMarketplace = false,
  onSuccess,
  onCancel,
}: QuickReviewFormProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('product');
  const [productRating, setProductRating] = useState<number | null>(null);
  const [productTags, setProductTags] = useState<string[]>([]);
  const [deliveryRating, setDeliveryRating] = useState<number | null>(null);
  const [deliveryTags, setDeliveryTags] = useState<string[]>([]);
  const [establishmentRating, setEstablishmentRating] = useState<number | null>(null);
  const [establishmentTags, setEstablishmentTags] = useState<string[]>([]);
  const [platformRating, setPlatformRating] = useState<number | null>(null);
  const [platformTags, setPlatformTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Decidir se mostra avaliação da plataforma (20% das vezes no marketplace)
  const showPlatformReview = isMarketplace && Math.random() < 0.2;

  const getSteps = (): Step[] => {
    const steps: Step[] = ['product'];
    if (hasDelivery) steps.push('delivery');
    steps.push('establishment');
    if (showPlatformReview) steps.push('platform');
    steps.push('comment');
    return steps;
  };

  const steps = getSteps();
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const stepIcons: Record<Step, React.ReactNode> = {
    product: <Package className="w-6 h-6" />,
    delivery: <Truck className="w-6 h-6" />,
    establishment: <Store className="w-6 h-6" />,
    platform: <Smartphone className="w-6 h-6" />,
    comment: <Check className="w-6 h-6" />,
    done: <Check className="w-6 h-6" />,
  };

  const stepTitles: Record<Step, string> = {
    product: 'Como foi o produto?',
    delivery: 'Como foi a entrega?',
    establishment: `Como foi a ${establishmentName}?`,
    platform: 'Como foi o VilaFood?',
    comment: 'Quer deixar um comentário?',
    done: 'Obrigado!',
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'product':
        return productRating !== null;
      case 'delivery':
        return deliveryRating !== null;
      case 'establishment':
        return establishmentRating !== null;
      case 'platform':
        return platformRating !== null;
      case 'comment':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goPrev = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Converter escala 0-10 para 1-5
      const convertToStars = (rating: number | null) => {
        if (rating === null) return null;
        return Math.ceil((rating / 10) * 5);
      };

      // Inserir review principal
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          order_id: orderId,
          establishment_id: establishmentId,
          user_id: user?.id,
          overall_rating: convertToStars(productRating) || 5,
          food_rating: convertToStars(productRating),
          delivery_rating: convertToStars(deliveryRating),
          service_rating: convertToStars(establishmentRating),
          comment: comment || null,
          selected_tags: [...productTags, ...deliveryTags, ...establishmentTags],
          rating_scale: productRating,
          is_verified_purchase: true,
          is_visible: true,
        });

      if (reviewError) throw reviewError;

      // Inserir review da plataforma se aplicável
      if (showPlatformReview && platformRating !== null) {
        await supabase
          .from('platform_reviews')
          .insert({
            order_id: orderId,
            customer_id: user?.id,
            rating: platformRating,
            selected_tags: platformTags,
            order_channel: 'marketplace',
          });
      }

      setCurrentStep('done');
      toast.success('Avaliação enviada com sucesso!');
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  if (currentStep === 'done') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-xl font-bold mb-2">Obrigado pela avaliação!</h3>
          <p className="text-muted-foreground">
            Sua opinião ajuda a melhorar nossos serviços.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {stepIcons[currentStep]}
          </div>
          <CardTitle className="text-lg">{stepTitles[currentStep]}</CardTitle>
        </div>
        <Progress value={progress} className="h-1" />
        <p className="text-xs text-muted-foreground mt-1">
          Passo {currentIndex + 1} de {steps.length}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {currentStep === 'product' && (
              <>
                <QuickRatingScale
                  value={productRating}
                  onChange={setProductRating}
                  label="De 0 a 10, como você avalia o produto?"
                />
                <RatingTags
                  category="product"
                  rating={productRating}
                  selectedTags={productTags}
                  onTagsChange={setProductTags}
                />
              </>
            )}

            {currentStep === 'delivery' && (
              <>
                <QuickRatingScale
                  value={deliveryRating}
                  onChange={setDeliveryRating}
                  label="De 0 a 10, como foi a entrega?"
                />
                <RatingTags
                  category="delivery"
                  rating={deliveryRating}
                  selectedTags={deliveryTags}
                  onTagsChange={setDeliveryTags}
                />
              </>
            )}

            {currentStep === 'establishment' && (
              <>
                <QuickRatingScale
                  value={establishmentRating}
                  onChange={setEstablishmentRating}
                  label="De 0 a 10, como foi o atendimento?"
                />
                <RatingTags
                  category="establishment"
                  rating={establishmentRating}
                  selectedTags={establishmentTags}
                  onTagsChange={setEstablishmentTags}
                />
              </>
            )}

            {currentStep === 'platform' && (
              <>
                <QuickRatingScale
                  value={platformRating}
                  onChange={setPlatformRating}
                  label="De 0 a 10, como foi usar o VilaFood?"
                />
                <RatingTags
                  category="platform"
                  rating={platformRating}
                  selectedTags={platformTags}
                  onTagsChange={setPlatformTags}
                />
              </>
            )}

            {currentStep === 'comment' && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Conte mais sobre sua experiência... (opcional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Seu feedback ajuda outros clientes e o estabelecimento a melhorar.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 pt-4">
          {currentIndex > 0 ? (
            <Button variant="outline" onClick={goPrev} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          ) : (
            <Button variant="ghost" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          )}

          {currentStep === 'comment' ? (
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Enviando...' : 'Enviar Avaliação'}
              <Check className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={goNext} 
              disabled={!canGoNext()}
              className="flex-1"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickReviewForm;
