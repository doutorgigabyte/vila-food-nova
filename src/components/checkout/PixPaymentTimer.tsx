/**
 * PixPaymentTimer - Componente de pagamento PIX com timer de 10 minutos (estilo 99Food)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  QrCode,
  Copy,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { createPaymentGateway } from '@/lib/payment';
import type { CreatePaymentResponse, PaymentStatus } from '@/lib/payment';
import { Price } from '@/components/ui/price';

interface PixPaymentTimerProps {
  orderId: string;
  establishmentId: string;
  amount: number;
  expirationMinutes?: number;
  onPaymentComplete?: (paymentId: string) => void;
  onPaymentExpired?: () => void;
  onPaymentFailed?: (error: string) => void;
  payerEmail?: string;
  payerName?: string;
}

export function PixPaymentTimer({
  orderId,
  establishmentId,
  amount,
  expirationMinutes = 10,
  onPaymentComplete,
  onPaymentExpired,
  onPaymentFailed,
  payerEmail = 'cliente@email.com',
  payerName,
}: PixPaymentTimerProps) {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [paymentData, setPaymentData] = useState<CreatePaymentResponse | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expirationMinutes * 60); // in seconds
  const [showQrCode, setShowQrCode] = useState(false);

  const generatePix = useCallback(async () => {
    setLoading(true);
    console.log('[PixPaymentTimer] Generating PIX with 10min expiration:', { orderId, establishmentId, amount });
    
    try {
      const gateway = createPaymentGateway(establishmentId);
      
      const result = await gateway.createPixPayment(
        orderId,
        amount,
        `Pedido #${orderId.slice(-8)}`,
        { email: payerEmail, name: payerName }
      );

      console.log('[PixPaymentTimer] PIX result:', {
        success: result.success,
        payment_id: result.payment_id,
        has_qr_code: !!result.pix_qr_code,
        has_qr_code_base64: !!result.pix_qr_code_base64,
      });

      setPaymentData(result);
      setStatus(result.status);
      setTimeLeft(expirationMinutes * 60); // Reset timer

      if (!result.success) {
        console.error('[PixPaymentTimer] PIX generation failed:', result.error);
        onPaymentFailed?.(result.error || 'Erro ao gerar PIX');
      }
    } catch (error) {
      console.error('[PixPaymentTimer] Exception:', error);
      const message = error instanceof Error ? error.message : 'Erro ao gerar PIX';
      toast.error(message);
      onPaymentFailed?.(message);
    } finally {
      setLoading(false);
    }
  }, [orderId, establishmentId, amount, payerEmail, payerName, expirationMinutes, onPaymentFailed]);

  const checkPaymentStatus = useCallback(async () => {
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
  }, [paymentData?.payment_id, establishmentId, onPaymentComplete]);

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
  }, [generatePix]);

  // Countdown timer
  useEffect(() => {
    if (status !== 'pending' || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onPaymentExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, timeLeft, onPaymentExpired]);

  // Poll for payment status every 5 seconds
  useEffect(() => {
    if (status === 'pending' && paymentData?.payment_id && timeLeft > 0) {
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [status, paymentData?.payment_id, timeLeft, checkPaymentStatus]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercent = (timeLeft / (expirationMinutes * 60)) * 100;
  const isExpiring = timeLeft < 60; // Less than 1 minute

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center space-y-4">
          <Skeleton className="h-48 w-48 rounded-lg" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-32" />
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
              {paymentData?.error || 'Tente novamente'}
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          </motion.div>
          <div>
            <p className="text-xl font-bold text-green-600">Pagamento Aprovado!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Seu pedido foi realizado com sucesso
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (timeLeft <= 0) {
    return (
      <Card className="border-orange-500">
        <CardContent className="pt-6 text-center space-y-4">
          <Clock className="h-12 w-12 text-orange-500 mx-auto" />
          <div>
            <p className="font-medium text-orange-600">PIX expirado</p>
            <p className="text-sm text-muted-foreground mt-1">
              O tempo para pagamento expirou
            </p>
          </div>
          <Button onClick={generatePix} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar novo PIX
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Timer header */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Aguardando pagamento</p>
          <div className="flex items-center justify-center gap-2">
            <Clock className={`h-5 w-5 ${isExpiring ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
            <span className={`text-3xl font-bold tabular-nums ${isExpiring ? 'text-red-500' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${isExpiring ? 'bg-red-500' : 'bg-primary'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="text-center py-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">Valor a pagar</p>
          <Price value={amount} size="xl" className="text-primary" />
        </div>

        {/* PIX Code - Copy/Paste */}
        <div className="space-y-3">
          <div className="relative">
            <div className="p-4 bg-muted rounded-xl text-sm font-mono break-all max-h-24 overflow-y-auto">
              {paymentData.pix_copy_paste || paymentData.pix_qr_code}
            </div>
            <Button
              size="sm"
              variant={copied ? 'default' : 'secondary'}
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

          {/* QR Code toggle */}
          <Button
            variant="ghost"
            className="w-full text-primary"
            onClick={() => setShowQrCode(!showQrCode)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showQrCode ? 'Ocultar QR Code' : 'Usar o QR code do Pix'}
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>

          {/* QR Code */}
          {showQrCode && paymentData.pix_qr_code_base64 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center"
            >
              <img
                src={
                  paymentData.pix_qr_code_base64.startsWith('data:')
                    ? paymentData.pix_qr_code_base64
                    : `data:image/png;base64,${paymentData.pix_qr_code_base64}`
                }
                alt="QR Code PIX"
                className="w-48 h-48 rounded-lg border"
              />
            </motion.div>
          )}
        </div>

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
              Já paguei
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Como pagar:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Copie o código acima</li>
            <li>Abra o app do seu banco</li>
            <li>Escolha pagar com PIX Copia e Cola</li>
            <li>Cole o código e confirme</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
