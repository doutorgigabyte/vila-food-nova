/**
 * CheckoutProPayment - Componente para pagamento via Mercado Pago Checkout Pro
 * Usado para cartões de crédito/débito com binary_mode e auto_return
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCardRejectionInfo } from '@/lib/payment/errors';

interface CheckoutItem {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  quantity: number;
  unit_price: number;
  picture_url?: string;
}

interface CheckoutProPaymentProps {
  orderId: string;
  establishmentId: string;
  amount: number;
  description?: string;
  items?: CheckoutItem[];
  payerEmail?: string;
  payerName?: string;
  payerPhone?: string;
  payerCpf?: string;
  deliveryFee?: number;
  onPaymentComplete?: (paymentId: string) => void;
  onPaymentFailed?: (error: string) => void;
}

type PaymentStatus = 'idle' | 'creating' | 'redirecting' | 'completed' | 'failed';

export function CheckoutProPayment({
  orderId,
  establishmentId,
  amount,
  description,
  items,
  payerEmail,
  payerName,
  payerPhone,
  payerCpf,
  deliveryFee,
  onPaymentComplete,
  onPaymentFailed
}: CheckoutProPaymentProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // Verificar se retornou do checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    const paymentId = urlParams.get('payment_id');
    const externalReference = urlParams.get('external_reference');

    if (paymentStatus && externalReference === orderId) {
      if (paymentStatus === 'approved' && paymentId) {
        setStatus('completed');
        onPaymentComplete?.(paymentId);
      } else if (paymentStatus === 'failure' || paymentStatus === 'rejected') {
        const statusDetail = urlParams.get('status_detail') || 'cc_rejected_other_reason';
        const rejectionInfo = getCardRejectionInfo(statusDetail);
        setStatus('failed');
        setError(rejectionInfo.message);
        onPaymentFailed?.(rejectionInfo.message);
      }
    }
  }, [orderId, onPaymentComplete, onPaymentFailed]);

  const handleCreateCheckout = async () => {
    setStatus('creating');
    setError(null);

    try {
      // Separar first_name e last_name do nome completo
      const nameParts = payerName?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const { data, error: fnError } = await supabase.functions.invoke('mercadopago-checkout-pro', {
        body: {
          order_id: orderId,
          establishment_id: establishmentId,
          amount,
          description: description || `Pedido #${orderId.slice(-8)}`,
          items: items && items.length > 0 ? items : undefined,
          payer: {
            email: payerEmail,
            first_name: firstName,
            last_name: lastName,
            phone: payerPhone,
            ...(payerCpf && {
              identification: {
                type: 'CPF',
                number: payerCpf.replace(/\D/g, '')
              }
            })
          },
          shipments: deliveryFee && deliveryFee > 0 ? {
            cost: deliveryFee,
            mode: 'not_specified'
          } : undefined
        }
      });

      if (fnError) throw fnError;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar checkout');
      }

      // PRODUÇÃO: Priorizar init_point (produção), fallback para sandbox_init_point
      const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production' || !import.meta.env.DEV;
      const redirectUrl = isProduction 
        ? (data.init_point || data.sandbox_init_point)
        : (data.sandbox_init_point || data.init_point);
      
      if (!redirectUrl) {
        throw new Error('URL de checkout não gerada');
      }

      setCheckoutUrl(redirectUrl);
      setStatus('redirecting');
      
      // Redirecionar para o checkout do Mercado Pago
      toast.info('Redirecionando para pagamento seguro...');
      
      // Pequeno delay para o toast aparecer
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);

    } catch (err: any) {
      console.error('Checkout Pro error:', err);
      // Try to get error from function response context
      let message = 'Erro ao iniciar pagamento';
      if (err?.context?.body) {
        try {
          const body = JSON.parse(err.context.body);
          message = body.error || message;
        } catch {}
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      setStatus('failed');
      toast.error(message);
    }
  };

  // Estado de sucesso
  if (status === 'completed') {
    return (
      <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="font-semibold text-lg">Pagamento Aprovado!</h3>
              <p className="text-muted-foreground text-sm">
                Seu pedido foi confirmado e está sendo preparado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado de erro
  if (status === 'failed' && error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold text-lg">Pagamento não aprovado</h3>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setStatus('idle');
                  setError(null);
                }}
              >
                Tentar novamente
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => onPaymentFailed?.('Usuário escolheu PIX')}
              >
                Pagar com PIX
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Info do pagamento */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Cartão de Crédito/Débito</p>
                <p className="text-sm text-muted-foreground">
                  Pagamento seguro via Mercado Pago
                </p>
              </div>
            </div>
            <span className="font-bold text-lg">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(amount)}
            </span>
          </div>

          {/* Benefícios */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Aprovação instantânea</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>100% seguro</span>
            </div>
          </div>

          {/* Botão de pagamento */}
          <Button 
            size="lg" 
            className="w-full"
            onClick={handleCreateCheckout}
            disabled={status === 'creating' || status === 'redirecting'}
          >
            {status === 'creating' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparando checkout...
              </>
            ) : status === 'redirecting' ? (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Redirecionando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar com Cartão
              </>
            )}
          </Button>

          {/* Link manual se redirect falhar */}
          {checkoutUrl && status === 'redirecting' && (
            <p className="text-center text-sm text-muted-foreground">
              Não redirecionou?{' '}
              <a 
                href={checkoutUrl} 
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Clique aqui
              </a>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
