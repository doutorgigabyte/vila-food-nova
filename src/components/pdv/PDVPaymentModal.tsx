import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  Smartphone,
  Check,
  Loader2,
  Copy,
  RefreshCw,
  AlertCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

interface PDVPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (paymentMethod: string, paymentId?: string, changeAmount?: number) => void;
  total: number;
  establishmentId: string;
  establishmentName: string;
  hasTerminal: boolean;
  hasMercadoPago: boolean;
}

type PaymentStatus = 'idle' | 'generating' | 'waiting' | 'approved' | 'error';

export function PDVPaymentModal({
  open,
  onClose,
  onSuccess,
  total,
  establishmentId,
  establishmentName,
  hasTerminal,
  hasMercadoPago
}: PDVPaymentModalProps) {
  // Use ref to store onSuccess callback to avoid useEffect dependency issues
  const onSuccessRef = useRef(onSuccess);
  
  // Update ref when onSuccess changes
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  
  // Cash state
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const changeAmount = receivedAmount ? parseFloat(receivedAmount) - total : 0;
  
  // PIX state
  const [pixStatus, setPixStatus] = useState<PaymentStatus>('idle');
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    copyPaste: string;
    paymentId: string;
    expiration?: string;
  } | null>(null);
  
  // Terminal state
  const [terminalStatus, setTerminalStatus] = useState<PaymentStatus>('idle');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [terminalPolling, setTerminalPolling] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setReceivedAmount("");
      setPixStatus('idle');
      setPixData(null);
      setTerminalStatus('idle');
      setPaymentIntentId(null);
      setTerminalPolling(false);
    }
  }, [open]);

  // Generate PIX QR Code
  const generatePix = async () => {
    setPixStatus('generating');
    
    try {
      // First, try to get establishment to check for static PIX key
      const { data: establishment } = await supabase
        .from('establishments')
        .select('pix_key, mercado_pago_token')
        .eq('id', establishmentId)
        .single();

      // If no Mercado Pago token, use static PIX key
      if (!establishment?.mercado_pago_token && establishment?.pix_key) {
        setPixData({
          qrCode: '',
          qrCodeBase64: '',
          copyPaste: establishment.pix_key,
          paymentId: '',
          expiration: undefined
        });
        setPixStatus('waiting');
        return;
      }

      // Try to generate dynamic PIX (will fail if no order_id, but we handle it)
      const { data, error } = await supabase.functions.invoke('mercadopago-pix', {
        body: {
          establishment_id: establishmentId,
          order_id: `pdv-temp-${Date.now()}`,
          amount: total,
          description: `Pedido PDV - ${establishmentName}`,
          payer_email: 'cliente@pdv.local',
          payer_name: 'Cliente PDV'
        }
      });

      // If error and we have static PIX key, use it
      if (error && establishment?.pix_key) {
        setPixData({
          qrCode: '',
          qrCodeBase64: '',
          copyPaste: establishment.pix_key,
          paymentId: '',
          expiration: undefined
        });
        setPixStatus('waiting');
        toast.info('Usando chave PIX estática (crie o pedido primeiro para PIX dinâmico)');
        return;
      }

      if (error) throw error;

      if (data?.success) {
        if (data.qr_code_base64 || data.qr_code) {
          setPixData({
            qrCode: data.qr_code || '',
            qrCodeBase64: data.qr_code_base64 || '',
            copyPaste: data.qr_code || data.pix_copy_paste || '',
            paymentId: data.payment_id || '',
            expiration: data.expiration
          });
          setPixStatus('waiting');
        } else if (data.pix_key) {
          // Static PIX fallback from response
          setPixData({
            qrCode: '',
            qrCodeBase64: '',
            copyPaste: data.pix_key,
            paymentId: '',
            expiration: undefined
          });
          setPixStatus('waiting');
        } else {
          throw new Error('Falha ao gerar PIX');
        }
      } else {
        throw new Error(data?.error || 'Falha ao gerar PIX');
      }
    } catch (error) {
      console.error('Error generating PIX:', error);
      
      // Final fallback: try to get static PIX key
      try {
        const { data: establishment } = await supabase
          .from('establishments')
          .select('pix_key')
          .eq('id', establishmentId)
          .single();

        if (establishment?.pix_key) {
          setPixData({
            qrCode: '',
            qrCodeBase64: '',
            copyPaste: establishment.pix_key,
            paymentId: '',
            expiration: undefined
          });
          setPixStatus('waiting');
          toast.info('Usando chave PIX estática');
        } else {
          setPixStatus('error');
          toast.error('Erro ao gerar PIX. Configure uma chave PIX no estabelecimento.');
        }
      } catch (fallbackError) {
        setPixStatus('error');
        toast.error('Erro ao gerar PIX');
      }
    }
  };

  // Poll PIX status
  useEffect(() => {
    if (pixStatus !== 'waiting' || !pixData?.paymentId) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('mercadopago-sale', {
          body: {
            action: 'get_payment',
            establishment_id: establishmentId,
            payment_data: { payment_id: pixData.paymentId }
          }
        });

        if (data?.status === 'approved') {
          setPixStatus('approved');
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          toast.success('Pagamento PIX confirmado!');
          setTimeout(() => onSuccessRef.current('pix', pixData.paymentId), 1500);
        }
      } catch (error) {
        console.error('Error checking PIX status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pixStatus, pixData?.paymentId, establishmentId]);

  // Copy PIX code
  const copyPixCode = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      toast.success('Código PIX copiado!');
    }
  };

  // Send to terminal
  const sendToTerminal = async () => {
    setTerminalStatus('generating');
    
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-point', {
        body: {
          action: 'create_order',
          establishment_id: establishmentId,
          amount: total,
          description: `Pedido PDV - ${establishmentName}`,
          external_reference: `pdv-${Date.now()}`
        }
      });

      if (error) throw error;

      if (data?.success && data?.payment_intent_id) {
        setPaymentIntentId(data.payment_intent_id);
        setTerminalStatus('waiting');
        setTerminalPolling(true);
        toast.success('Pagamento enviado para maquineta!');
      } else {
        throw new Error(data?.error || 'Falha ao enviar para maquineta');
      }
    } catch (error: any) {
      console.error('Error sending to terminal:', error);
      setTerminalStatus('error');
      toast.error(error.message || 'Erro ao enviar para maquineta');
    }
  };

  // Poll terminal status
  useEffect(() => {
    if (!terminalPolling || !paymentIntentId) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('mercadopago-point', {
          body: {
            action: 'get_order_status',
            establishment_id: establishmentId,
            payment_intent_id: paymentIntentId
          }
        });

        if (data?.status === 'approved') {
          setTerminalStatus('approved');
          setTerminalPolling(false);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          toast.success('Pagamento na maquineta confirmado!');
          setTimeout(() => onSuccessRef.current('credit_card', data.payment_id), 1500);
        } else if (data?.status === 'cancelled' || data?.status === 'error') {
          setTerminalStatus('error');
          setTerminalPolling(false);
          toast.error('Pagamento cancelado ou com erro');
        }
      } catch (error) {
        console.error('Error checking terminal status:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [terminalPolling, paymentIntentId, establishmentId]);

  // Cancel terminal payment
  const cancelTerminal = async () => {
    if (!paymentIntentId) return;

    try {
      await supabase.functions.invoke('mercadopago-point', {
        body: {
          action: 'cancel_order',
          establishment_id: establishmentId,
          payment_intent_id: paymentIntentId
        }
      });
      
      setTerminalStatus('idle');
      setPaymentIntentId(null);
      setTerminalPolling(false);
      toast.info('Pagamento cancelado');
    } catch (error) {
      console.error('Error cancelling terminal:', error);
    }
  };

  // Handle cash payment
  const handleCashPayment = () => {
    if (!receivedAmount || parseFloat(receivedAmount) < total) {
      toast.error('Valor recebido menor que o total');
      return;
    }
    
    const change = changeAmount;
    
    // Show success feedback
    toast.success('Pagamento em dinheiro confirmado!');
    
    // Cash payment doesn't have a payment ID
    // Pass change amount to callback
    onSuccessRef.current('cash', undefined, change);
    
    // Close modal after a brief delay to show feedback
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Pagamento
            <Badge variant="secondary" className="text-lg">
              R$ {total.toFixed(2)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="cash" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cash" className="gap-2">
              <Banknote className="h-4 w-4" />
              Dinheiro
            </TabsTrigger>
            <TabsTrigger value="pix" className="gap-2" disabled={!hasMercadoPago}>
              <QrCode className="h-4 w-4" />
              PIX
            </TabsTrigger>
            <TabsTrigger value="card" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Cartão
            </TabsTrigger>
          </TabsList>

          {/* CASH TAB */}
          <TabsContent value="cash" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="received">Valor Recebido</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="received"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="pl-10 text-xl h-14 font-mono"
                    autoFocus
                  />
                </div>
              </div>

              {receivedAmount && parseFloat(receivedAmount) >= total && (
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Troco</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        R$ {changeAmount.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 50, 100, 200, total].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    onClick={() => setReceivedAmount(value.toString())}
                    className="h-12"
                  >
                    {value === total ? 'Exato' : `R$ ${value}`}
                  </Button>
                ))}
              </div>

              <Button
                className="w-full h-14 text-lg"
                onClick={handleCashPayment}
                disabled={!receivedAmount || parseFloat(receivedAmount) < total}
              >
                <Check className="mr-2 h-5 w-5" />
                Confirmar Pagamento
              </Button>
            </div>
          </TabsContent>

          {/* PIX TAB */}
          <TabsContent value="pix" className="space-y-4 mt-4">
            {pixStatus === 'idle' && (
              <div className="text-center space-y-4">
                <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Gere um QR Code PIX para o cliente pagar
                </p>
                <Button onClick={generatePix} className="w-full h-14">
                  <QrCode className="mr-2 h-5 w-5" />
                  Gerar QR Code PIX
                </Button>
              </div>
            )}

            {pixStatus === 'generating' && (
              <div className="text-center space-y-4 py-8">
                <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground">Gerando QR Code...</p>
              </div>
            )}

            {pixStatus === 'waiting' && pixData && (
              <div className="space-y-4">
                {pixData.qrCodeBase64 ? (
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 border rounded-lg"
                    />
                  </div>
                ) : (
                  <Card className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Chave PIX</p>
                    <p className="font-mono text-sm break-all">{pixData.copyPaste}</p>
                  </Card>
                )}

                <div className="text-center">
                  <Badge variant="outline" className="gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Aguardando pagamento...
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyPixCode}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Código PIX
                </Button>

                {pixData.expiration && (
                  <p className="text-xs text-center text-muted-foreground">
                    Expira em: {new Date(pixData.expiration).toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            {pixStatus === 'approved' && (
              <div className="text-center space-y-4 py-8">
                <div className="h-16 w-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-green-600">
                  Pagamento Aprovado!
                </p>
              </div>
            )}

            {pixStatus === 'error' && (
              <div className="text-center space-y-4 py-8">
                <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
                <p className="text-muted-foreground">Erro ao gerar PIX</p>
                <Button onClick={generatePix} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
              </div>
            )}
          </TabsContent>

          {/* CARD TAB */}
          <TabsContent value="card" className="space-y-4 mt-4">
            {hasTerminal ? (
              <>
                {terminalStatus === 'idle' && (
                  <div className="space-y-4">
                    <Card className="p-4 text-center">
                      <Smartphone className="h-12 w-12 mx-auto mb-3 text-primary" />
                      <p className="font-medium">Maquineta Conectada</p>
                      <p className="text-sm text-muted-foreground">
                        Envie o pagamento diretamente para a maquineta
                      </p>
                    </Card>

                    <Button onClick={sendToTerminal} className="w-full h-14 text-lg">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Cobrar na Maquineta
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">ou registre manualmente</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-12 flex-col"
                        onClick={() => {
                          toast.success('Pagamento em crédito registrado!');
                          onSuccessRef.current('credit_card');
                        }}
                      >
                        <CreditCard className="h-4 w-4 mb-1" />
                        <span className="text-xs">Crédito</span>
                      </Button>
                      <Button 
                        variant="outline"
                        className="h-12 flex-col"
                        onClick={() => {
                          toast.success('Pagamento em débito registrado!');
                          onSuccessRef.current('debit_card');
                        }}
                      >
                        <CreditCard className="h-4 w-4 mb-1" />
                        <span className="text-xs">Débito</span>
                      </Button>
                    </div>
                  </div>
                )}

                {terminalStatus === 'generating' && (
                  <div className="text-center space-y-4 py-8">
                    <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                    <p className="text-muted-foreground">Enviando para maquineta...</p>
                  </div>
                )}

                {terminalStatus === 'waiting' && (
                  <div className="space-y-4">
                    <Card className="p-6 text-center bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                      <div className="relative">
                        <Smartphone className="h-20 w-20 mx-auto text-blue-600 animate-pulse" />
                        <Badge className="absolute -top-2 -right-2 bg-blue-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </Badge>
                      </div>
                      <p className="mt-4 font-semibold text-lg">Aguardando pagamento</p>
                      <p className="text-sm text-muted-foreground">
                        Passe o cartão na maquineta
                      </p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        R$ {total.toFixed(2)}
                      </p>
                    </Card>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={cancelTerminal}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                )}

                {terminalStatus === 'approved' && (
                  <div className="text-center space-y-4 py-8">
                    <div className="h-16 w-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-lg font-semibold text-green-600">
                      Pagamento Aprovado!
                    </p>
                  </div>
                )}

                {terminalStatus === 'error' && (
                  <div className="text-center space-y-4 py-8">
                    <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
                    <p className="text-muted-foreground">Erro ou pagamento cancelado</p>
                    <Button onClick={() => setTerminalStatus('idle')} variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar Novamente
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <Card className="p-4 text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium">Pagamento Manual</p>
                  <p className="text-sm text-muted-foreground">
                    Registre o pagamento após receber no cartão
                  </p>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-14 flex-col"
                    onClick={() => {
                      toast.success('Pagamento em crédito registrado!');
                      onSuccessRef.current('credit_card');
                    }}
                  >
                    <CreditCard className="h-5 w-5 mb-1" />
                    Crédito
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-14 flex-col"
                    onClick={() => {
                      toast.success('Pagamento em débito registrado!');
                      onSuccessRef.current('debit_card');
                    }}
                  >
                    <CreditCard className="h-5 w-5 mb-1" />
                    Débito
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
