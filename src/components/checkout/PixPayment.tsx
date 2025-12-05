/**
 * PixPayment - Componente de pagamento PIX com QR Code
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  QrCode,
  Copy,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { createPaymentGateway, PaymentGateway } from '@/lib/payment';
import type { CreatePaymentResponse, PaymentStatus } from '@/lib/payment';

interface PixPaymentProps {
  orderId: string;
  establishmentId: string;
  amount: number;
  onPaymentComplete?: (paymentId: string) => void;
  onPaymentFailed?: (error: string) => void;
  payerEmail?: string;
  payerName?: string;
}

export function PixPayment({
  orderId,
  establishmentId,
  amount,
  onPaymentComplete,
  onPaymentFailed,
  payerEmail = 'cliente@email.com',
  payerName,
}: PixPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [paymentData, setPaymentData] = useState<CreatePaymentResponse | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [copied, setCopied] = useState(false);

  const generatePix = async () => {
    setLoading(true);
    try {
      const gateway = createPaymentGateway(establishmentId);
      const result = await gateway.createPixPayment(
        orderId,
        amount,
        `Pedido #${orderId.slice(-8)}`,
        { email: payerEmail, name: payerName }
      );

      setPaymentData(result);
      setStatus(result.status);

      if (!result.success) {
        onPaymentFailed?.(result.error || 'Erro ao gerar PIX');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar PIX';
      toast.error(message);
      onPaymentFailed?.(message);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.payment_id) return;

    setChecking(true);
    try {
      const gateway = createPaymentGateway(establishmentId);
      const result = await gateway.getPayment(paymentData.payment_id);

      if (result.success) {
        setStatus(result.status);

        if (result.status === 'approved') {
          toast.success('Pagamento aprovado!');
          onPaymentComplete?.(paymentData.payment_id);
        }
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    } finally {
      setChecking(false);
    }
  };

  const copyPixCode = () => {
    const code = paymentData?.pix_copy_paste || paymentData?.pix_qr_code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Generate PIX on mount
  useEffect(() => {
    generatePix();
  }, [orderId, establishmentId, amount]);

  // Poll for payment status every 5 seconds
  useEffect(() => {
    if (status === 'pending' && paymentData?.payment_id) {
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [status, paymentData?.payment_id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gerando PIX...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Skeleton className="h-48 w-48 rounded-lg" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!paymentData?.success) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <p className="font-medium text-destructive">Erro ao gerar PIX</p>
            <p className="text-sm text-muted-foreground mt-1">
              {paymentData?.error || 'Tente novamente ou escolha outra forma de pagamento'}
            </p>
          </div>
          <Button onClick={generatePix} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'approved') {
    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <div>
            <p className="text-xl font-bold text-green-600">Pagamento Aprovado!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Seu pagamento foi confirmado com sucesso
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Pague com PIX
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {PaymentGateway.getStatusLabel(status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex flex-col items-center">
          {paymentData.pix_qr_code_base64 ? (
            <img
              src={
                paymentData.pix_qr_code_base64.startsWith('data:')
                  ? paymentData.pix_qr_code_base64
                  : `data:image/png;base64,${paymentData.pix_qr_code_base64}`
              }
              alt="QR Code PIX"
              className="w-48 h-48 rounded-lg border"
            />
          ) : (
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
              <QrCode className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Valor a pagar</p>
          <p className="text-2xl font-bold text-primary">
            R$ {amount.toFixed(2)}
          </p>
        </div>

        {/* Copy Code */}
        {(paymentData.pix_copy_paste || paymentData.pix_qr_code) && (
          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Ou copie o código PIX
            </p>
            <div className="relative">
              <div className="p-3 bg-muted rounded-lg text-xs font-mono break-all max-h-20 overflow-y-auto">
                {paymentData.pix_copy_paste || paymentData.pix_qr_code}
              </div>
              <Button
                size="sm"
                variant={copied ? 'default' : 'outline'}
                className="absolute top-2 right-2"
                onClick={copyPixCode}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Check Status Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={checkPaymentStatus}
          disabled={checking}
        >
          {checking ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar pagamento
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>1. Abra o app do seu banco</p>
          <p>2. Escolha pagar com PIX</p>
          <p>3. Escaneie o QR Code ou cole o código</p>
          <p>4. Confirme o pagamento</p>
        </div>

        {paymentData.pix_expiration && (
          <p className="text-xs text-center text-muted-foreground">
            ⏰ Código válido por 30 minutos
          </p>
        )}
      </CardContent>
    </Card>
  );
}
