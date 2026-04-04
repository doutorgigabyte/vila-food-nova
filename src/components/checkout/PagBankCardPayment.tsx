/**
 * PagBankCardPayment - Checkout Transparente com SDK de Criptografia
 * 
 * Usa o SDK do PagBank para criptografar dados do cartão no browser
 * e envia para a Edge Function processar o pagamento.
 * 
 * Documentação: https://dev.pagbank.uol.com.br/reference/criar-pagar-pedido-com-cartao
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, AlertCircle, CheckCircle, Lock, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// PagBank SDK types
declare global {
  interface Window {
    PagSeguro?: {
      encryptCard: (data: {
        publicKey: string;
        holder: string;
        number: string;
        expMonth: string;
        expYear: string;
        securityCode: string;
      }) => {
        encryptedCard: string;
        hasErrors: boolean;
        errors: Array<{ code: string; message: string }>;
      };
    };
  }
}

interface PagBankCardPaymentProps {
  orderId: string;
  establishmentId: string;
  amount: number;
  description?: string;
  payerEmail?: string;
  payerName?: string;
  payerCpf?: string;
  payerPhone?: string;
  onPaymentComplete?: (paymentId: string) => void;
  onPaymentFailed?: (error: string) => void;
}

type PaymentStatus = 'idle' | 'loading_sdk' | 'encrypting' | 'processing' | 'completed' | 'failed';

interface CardErrors {
  number?: string;
  holder?: string;
  expMonth?: string;
  expYear?: string;
  securityCode?: string;
  cpf?: string;
}

export function PagBankCardPayment({
  orderId,
  establishmentId,
  amount,
  description,
  payerEmail,
  payerName,
  payerCpf,
  payerPhone,
  onPaymentComplete,
  onPaymentFailed
}: PagBankCardPaymentProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CardErrors>({});

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(payerName || '');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [holderCpf, setHolderCpf] = useState(payerCpf || '');
  const [installments, setInstallments] = useState('1');

  // Load PagBank SDK
  useEffect(() => {
    const loadSdk = () => {
      if (window.PagSeguro) {
        setSdkLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js';
      script.async = true;
      script.onload = () => {
        console.log('PagBank SDK loaded');
        setSdkLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load PagBank SDK');
        setError('Erro ao carregar SDK de pagamento');
        setStatus('failed');
      };
      document.body.appendChild(script);
    };

    loadSdk();
  }, []);

  // Fetch public key
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const { data, error } = await supabase
          .from('establishments')
          .select('pagseguro_token')
          .eq('id', establishmentId)
          .single();

        if (error || !data?.pagseguro_token) {
          // Fallback to platform public key from secrets
          const PLATFORM_PUBLIC_KEY = import.meta.env.VITE_PAGSEGURO_PUBLIC_KEY;
          if (PLATFORM_PUBLIC_KEY) {
            setPublicKey(PLATFORM_PUBLIC_KEY);
          } else {
            setError('PagBank não configurado para este estabelecimento');
          }
          return;
        }

        // For now, use platform public key as establishments don't store their own
        const PLATFORM_PUBLIC_KEY = import.meta.env.VITE_PAGSEGURO_PUBLIC_KEY;
        setPublicKey(PLATFORM_PUBLIC_KEY || null);
      } catch (err) {
        console.error('Error fetching public key:', err);
      }
    };

    fetchPublicKey();
  }, [establishmentId]);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  // Format CPF
  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  };

  // Validate fields
  const validateFields = (): boolean => {
    const errors: CardErrors = {};
    
    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 13 || cleanNumber.length > 19) {
      errors.number = 'Número do cartão inválido';
    }

    if (!cardHolder || cardHolder.trim().split(' ').length < 2) {
      errors.holder = 'Nome completo é obrigatório';
    }

    if (!expMonth || parseInt(expMonth) < 1 || parseInt(expMonth) > 12) {
      errors.expMonth = 'Mês inválido';
    }

    const currentYear = new Date().getFullYear();
    if (!expYear || parseInt(expYear) < currentYear || parseInt(expYear) > currentYear + 20) {
      errors.expYear = 'Ano inválido';
    }

    if (!securityCode || securityCode.length < 3 || securityCode.length > 4) {
      errors.securityCode = 'CVV inválido';
    }

    const cleanCpf = holderCpf.replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11) {
      errors.cpf = 'CPF inválido';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle payment
  const handlePayment = async () => {
    if (!validateFields()) {
      toast.error('Por favor, corrija os campos destacados');
      return;
    }

    if (!sdkLoaded || !window.PagSeguro) {
      setError('SDK de pagamento não carregado. Recarregue a página.');
      setStatus('failed');
      return;
    }

    if (!publicKey) {
      setError('Chave pública do PagBank não configurada');
      setStatus('failed');
      return;
    }

    setStatus('encrypting');
    setError(null);

    try {
      // Encrypt card data using PagBank SDK
      const cleanNumber = cardNumber.replace(/\D/g, '');
      
      const encryptResult = window.PagSeguro.encryptCard({
        publicKey,
        holder: cardHolder.toUpperCase(),
        number: cleanNumber,
        expMonth: expMonth.padStart(2, '0'),
        expYear: expYear,
        securityCode,
      });

      if (encryptResult.hasErrors) {
        const errorMessages = encryptResult.errors.map(e => {
          switch (e.code) {
            case 'INVALID_NUMBER': return 'Número do cartão inválido';
            case 'INVALID_SECURITY_CODE': return 'Código de segurança inválido';
            case 'INVALID_EXPIRATION_MONTH': return 'Mês de expiração inválido';
            case 'INVALID_EXPIRATION_YEAR': return 'Ano de expiração inválido';
            case 'INVALID_PUBLIC_KEY': return 'Erro de configuração (chave pública)';
            case 'INVALID_HOLDER': return 'Nome do titular inválido';
            default: return e.message;
          }
        });
        throw new Error(errorMessages.join(', '));
      }

      console.log('Card encrypted successfully');
      setStatus('processing');

      // Send to Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('pagseguro-card', {
        body: {
          establishment_id: establishmentId,
          order_id: orderId,
          amount: Math.round(amount * 100), // Centavos
          description: description || `Pedido #${orderId.slice(-8)}`,
          encrypted_card: encryptResult.encryptedCard,
          security_code: securityCode,
          holder: {
            name: cardHolder.toUpperCase(),
            tax_id: holderCpf.replace(/\D/g, ''),
          },
          installments: parseInt(installments),
          customer: {
            name: payerName || cardHolder,
            email: payerEmail,
            tax_id: holderCpf.replace(/\D/g, ''),
            phone: payerPhone?.replace(/\D/g, ''),
          },
          with_split: true,
        },
      });

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || 'Pagamento não aprovado');
      }

      setStatus('completed');
      toast.success('Pagamento aprovado!');
      onPaymentComplete?.(data.payment_id);

    } catch (err: any) {
      console.error('PagBank card payment error:', err);
      const message = err.message || 'Erro ao processar pagamento';
      setError(message);
      setStatus('failed');
      toast.error(message);
      onPaymentFailed?.(message);
    }
  };

  // Completed state
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

  // Failed state
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

  // Generate year options (current year + 20 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear + i);

  // Generate installment options based on amount
  const maxInstallments = Math.min(12, Math.floor(amount / 50)); // Mínimo R$50 por parcela
  const installmentOptions = Array.from({ length: maxInstallments }, (_, i) => {
    const num = i + 1;
    const installmentValue = amount / num;
    return {
      value: num.toString(),
      label: num === 1 
        ? `1x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} (sem juros)`
        : `${num}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentValue)} (sem juros)`
    };
  });

  const isProcessing = status === 'encrypting' || status === 'processing';

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Cartão de Crédito
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Card Number */}
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Número do Cartão</Label>
          <Input
            id="cardNumber"
            type="text"
            placeholder="0000 0000 0000 0000"
            value={formatCardNumber(cardNumber)}
            onChange={(e) => setCardNumber(e.target.value)}
            className={fieldErrors.number ? 'border-destructive' : ''}
            disabled={isProcessing}
            maxLength={19}
          />
          {fieldErrors.number && (
            <p className="text-destructive text-xs">{fieldErrors.number}</p>
          )}
        </div>

        {/* Card Holder */}
        <div className="space-y-2">
          <Label htmlFor="cardHolder">Nome no Cartão</Label>
          <Input
            id="cardHolder"
            type="text"
            placeholder="NOME COMPLETO"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
            className={fieldErrors.holder ? 'border-destructive' : ''}
            disabled={isProcessing}
          />
          {fieldErrors.holder && (
            <p className="text-destructive text-xs">{fieldErrors.holder}</p>
          )}
        </div>

        {/* Expiry and CVV */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="expMonth">Mês</Label>
            <Select value={expMonth} onValueChange={setExpMonth} disabled={isProcessing}>
              <SelectTrigger className={fieldErrors.expMonth ? 'border-destructive' : ''}>
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = (i + 1).toString().padStart(2, '0');
                  return <SelectItem key={month} value={month}>{month}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expYear">Ano</Label>
            <Select value={expYear} onValueChange={setExpYear} disabled={isProcessing}>
              <SelectTrigger className={fieldErrors.expYear ? 'border-destructive' : ''}>
                <SelectValue placeholder="AAAA" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="securityCode">CVV</Label>
            <Input
              id="securityCode"
              type="text"
              placeholder="123"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={fieldErrors.securityCode ? 'border-destructive' : ''}
              disabled={isProcessing}
              maxLength={4}
            />
          </div>
        </div>

        {/* CPF */}
        <div className="space-y-2">
          <Label htmlFor="holderCpf">CPF do Titular</Label>
          <Input
            id="holderCpf"
            type="text"
            placeholder="000.000.000-00"
            value={formatCpf(holderCpf)}
            onChange={(e) => setHolderCpf(e.target.value)}
            className={fieldErrors.cpf ? 'border-destructive' : ''}
            disabled={isProcessing}
            maxLength={14}
          />
          {fieldErrors.cpf && (
            <p className="text-destructive text-xs">{fieldErrors.cpf}</p>
          )}
        </div>

        {/* Installments */}
        {installmentOptions.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="installments">Parcelas</Label>
            <Select value={installments} onValueChange={setInstallments} disabled={isProcessing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {installmentOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>Criptografia RSA</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>PCI Compliant</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="font-medium">Total a pagar:</span>
          <span className="font-bold text-lg">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
          </span>
        </div>

        {/* Pay button */}
        <Button 
          size="lg" 
          className="w-full"
          onClick={handlePayment}
          disabled={isProcessing || !sdkLoaded}
        >
          {status === 'encrypting' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criptografando dados...
            </>
          ) : status === 'processing' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando pagamento...
            </>
          ) : !sdkLoaded ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Pagamento processado por <strong>PagBank</strong>
        </p>
      </CardContent>
    </Card>
  );
}
