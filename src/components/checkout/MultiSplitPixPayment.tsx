import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  QrCode, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Store,
  RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { useMultiSplitPayment } from '@/hooks/useMultiSplitPayment';

interface SplitItem {
  establishment_id: string;
  establishment_name: string;
  order_id: string;
  amount: number;
}

interface MultiSplitPixPaymentProps {
  checkoutId: string;
  totalAmount: number;
  platformFee: number;
  items: SplitItem[];
  payerEmail?: string;
  payerName?: string;
  onPaymentComplete: () => void;
  onPaymentFailed: (error: string) => void;
}

export function MultiSplitPixPayment({
  checkoutId,
  totalAmount,
  platformFee,
  items,
  payerEmail,
  payerName,
  onPaymentComplete,
  onPaymentFailed,
}: MultiSplitPixPaymentProps) {
  const { createMultiSplitPayment, checkPaymentStatus, loading, checking } = useMultiSplitPayment();
  const [paymentData, setPaymentData] = useState<{
    qr_code?: string;
    qr_code_base64?: string;
    expiration?: string;
    split_id?: string;
  } | null>(null);
  const [status, setStatus] = useState<'loading' | 'pending' | 'approved' | 'failed'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initPayment();
  }, []);

  useEffect(() => {
    if (status !== 'pending' || !paymentData?.split_id) return;

    const interval = setInterval(async () => {
      const result = await checkPaymentStatus(checkoutId);
      if (result.success) {
        if (result.status === 'paid' || result.mp_status === 'approved') {
          setStatus('approved');
          onPaymentComplete();
        } else if (result.status === 'rejected' || result.mp_status === 'rejected') {
          setStatus('failed');
          onPaymentFailed('Pagamento rejeitado');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, paymentData?.split_id, checkoutId]);

  const initPayment = async () => {
    setStatus('loading');
    
    const splitItems = items.map(item => ({
      establishment_id: item.establishment_id,
      order_id: item.order_id,
      amount: item.amount,
    }));

    const result = await createMultiSplitPayment(
      checkoutId,
      totalAmount,
      splitItems,
      payerEmail,
      payerName,
      `Pedido Multi-Vila - ${items.length} lojas`
    );

    if (result.success) {
      setPaymentData({
        qr_code: result.qr_code,
        qr_code_base64: result.qr_code_base64,
        expiration: result.expiration,
        split_id: result.split_id,
      });
      setStatus('pending');
    } else {
      setStatus('failed');
      onPaymentFailed(result.error || 'Erro ao gerar PIX');
    }
  };

  const copyPixCode = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCheckStatus = async () => {
    const result = await checkPaymentStatus(checkoutId);
    if (result.success) {
      if (result.status === 'paid' || result.mp_status === 'approved') {
        setStatus('approved');
        onPaymentComplete();
      } else {
        toast.info('Aguardando pagamento...');
      }
    }
  };

  if (status === 'loading') {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-48 w-48 mx-auto" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (status === 'approved') {
    return (
      <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
            Pagamento Confirmado!
          </h3>
          <p className="text-muted-foreground">
            Seus pedidos foram enviados para os estabelecimentos.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-bold mb-2">Erro no Pagamento</h3>
          <p className="text-muted-foreground mb-4">
            Não foi possível gerar o PIX. Tente novamente.
          </p>
          <Button onClick={initPayment} disabled={loading}>
            {loading ? 'Gerando...' : 'Tentar Novamente'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="w-5 h-5" />
            Resumo do Pedido Multi-Vila
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{item.establishment_name}</span>
              <span className="font-medium">R$ {item.amount.toFixed(2)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Taxa de serviço
              <Badge variant="outline" className="text-xs">5%</Badge>
            </span>
            <span>R$ {platformFee.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">R$ {totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* PIX Payment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Pague com PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentData?.qr_code_base64 ? (
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-lg">
                <img
                  src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="w-24 h-24 text-muted-foreground" />
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-2xl font-bold text-primary mb-1">
              R$ {totalAmount.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code ou copie o código abaixo
            </p>
          </div>

          {paymentData?.qr_code && (
            <div className="relative">
              <div className="p-3 bg-muted rounded-lg text-xs break-all font-mono max-h-20 overflow-y-auto">
                {paymentData.qr_code}
              </div>
              <Button
                size="sm"
                variant={copied ? "secondary" : "default"}
                className="absolute top-2 right-2 gap-1"
                onClick={copyPixCode}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleCheckStatus}
            disabled={checking}
          >
            {checking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Já paguei, verificar
              </>
            )}
          </Button>

          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Abra o app do seu banco
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Escolha pagar com PIX
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Escaneie o código ou cole o código copiado
            </p>
          </div>

          {paymentData?.expiration && (
            <p className="text-xs text-center text-muted-foreground">
              PIX válido até {new Date(paymentData.expiration).toLocaleString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
