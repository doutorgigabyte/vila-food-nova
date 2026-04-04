import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReviewOrder = () => {
  const { orderId, token } = useParams<{ orderId: string; token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    validateAndFetchOrder();
  }, [orderId, token]);

  const validateAndFetchOrder = async () => {
    if (!orderId || !token) {
      setError('Link inválido');
      setLoading(false);
      return;
    }

    try {
      // Fetch order with token validation
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          establishment:establishments(id, name, slug, logo_url)
        `)
        .eq('id', orderId)
        .eq('review_token', token)
        .single();

      if (orderError || !orderData) {
        setError('Pedido não encontrado ou link expirado');
        setLoading(false);
        return;
      }

      // Check if token is expired
      if (orderData.review_token_expires_at) {
        const expiresAt = new Date(orderData.review_token_expires_at);
        if (expiresAt < new Date()) {
          setError('Este link expirou. Avaliações devem ser feitas em até 7 dias após a entrega.');
          setLoading(false);
          return;
        }
      }

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (existingReview) {
        setAlreadyReviewed(true);
      }

      setOrder(orderData);
    } catch (err) {
      console.error('Error validating order:', err);
      setError('Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <div className="flex justify-center">
              <Skeleton className="h-12 w-48" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h1 className="text-xl font-bold mb-2">Ops!</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/marketplace')}>
              Voltar ao marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyReviewed || submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">
              {submitted ? 'Obrigado pela avaliação!' : 'Pedido já avaliado'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {submitted 
                ? 'Sua opinião é muito importante para nós!' 
                : 'Você já enviou uma avaliação para este pedido.'
              }
            </p>
            <Button onClick={() => navigate(`/loja/${order?.establishment?.slug}`)}>
              Ver cardápio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto">
        {order?.establishment?.logo_url && (
          <div className="flex justify-center mb-6">
            <img 
              src={order.establishment.logo_url} 
              alt={order.establishment.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-border"
            />
          </div>
        )}

        <ReviewForm
          orderId={orderId!}
          establishmentId={order.establishment.id}
          establishmentName={order.establishment.name}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
};

export default ReviewOrder;
