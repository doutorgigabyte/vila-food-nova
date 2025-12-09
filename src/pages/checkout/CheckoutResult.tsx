/**
 * CheckoutResult - Página de callback após pagamento no Checkout Pro
 * Recebe parâmetros da URL e exibe status do pagamento
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, ArrowLeft, Home, ShoppingBag } from 'lucide-react';
import { getCardRejectionInfo } from '@/lib/payment/errors';
import { supabase } from '@/integrations/supabase/client';

type PaymentResult = 'success' | 'failure' | 'pending' | 'unknown';

export default function CheckoutResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<{ 
    establishment_slug?: string; 
    total?: number 
  } | null>(null);

  const status = (searchParams.get('status') as PaymentResult) || 'unknown';
  const orderId = searchParams.get('order_id') || searchParams.get('external_reference');
  const paymentId = searchParams.get('payment_id');
  const statusDetail = searchParams.get('status_detail');

  // Buscar detalhes do pedido
  useEffect(() => {
    if (orderId) {
      supabase
        .from('orders')
        .select('total, establishments(slug)')
        .eq('id', orderId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setOrderDetails({
              establishment_slug: (data.establishments as { slug?: string })?.slug,
              total: data.total
            });
          }
        });
    }
  }, [orderId]);

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          iconClass: 'text-green-500',
          bgClass: 'bg-green-50 dark:bg-green-950/20 border-green-500/30',
          title: 'Pagamento Aprovado!',
          description: 'Seu pedido foi confirmado e está sendo preparado.',
          showOrderLink: true
        };
      case 'failure':
        const rejectionInfo = statusDetail 
          ? getCardRejectionInfo(statusDetail)
          : null;
        return {
          icon: XCircle,
          iconClass: 'text-destructive',
          bgClass: 'bg-red-50 dark:bg-red-950/20 border-destructive/30',
          title: rejectionInfo?.title || 'Pagamento não aprovado',
          description: rejectionInfo?.message || 'Não foi possível processar seu pagamento. Tente novamente ou use outro meio de pagamento.',
          showRetry: true
        };
      case 'pending':
        return {
          icon: Clock,
          iconClass: 'text-yellow-500',
          bgClass: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500/30',
          title: 'Pagamento em Análise',
          description: 'Seu pagamento está sendo processado. Você receberá uma notificação quando for confirmado.',
          showOrderLink: true
        };
      default:
        return {
          icon: Clock,
          iconClass: 'text-muted-foreground',
          bgClass: 'bg-muted border-border',
          title: 'Status desconhecido',
          description: 'Não foi possível determinar o status do pagamento. Entre em contato com o suporte.',
          showRetry: true
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${config.bgClass}`}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Icon className={`h-16 w-16 ${config.iconClass}`} />
          </div>
          <CardTitle className="text-2xl">{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {config.description}
          </p>

          {/* Detalhes do pedido */}
          {orderId && (
            <div className="bg-background/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pedido:</span>
                <span className="font-mono">#{orderId.slice(-8)}</span>
              </div>
              {paymentId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID Pagamento:</span>
                  <span className="font-mono">{paymentId}</span>
                </div>
              )}
              {orderDetails?.total && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(orderDetails.total)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-3">
            {config.showOrderLink && orderId && (
              <Button asChild className="w-full">
                <Link to={`/meus-pedidos`}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Acompanhar Pedido
                </Link>
              </Button>
            )}

            {config.showRetry && (
              <>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </>
            )}

            <Button variant="outline" asChild className="w-full">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
