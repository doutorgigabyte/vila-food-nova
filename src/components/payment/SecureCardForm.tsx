/**
 * Secure Card Form - PCI Compliance
 * Componente que usa Secure Fields do Mercado Pago para tokenização segura
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMercadoPagoSDK } from '@/hooks/useMercadoPagoSDK';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Lock, ShieldCheck } from 'lucide-react';

interface SecureCardFormProps {
  amount: number;
  onTokenCreated: (tokenData: CardTokenResult) => void;
  onError: (error: string) => void;
  establishmentName?: string;
}

interface CardTokenResult {
  token: string;
  paymentMethodId: string;
  issuerId: string;
  lastFourDigits: string;
  cardholderName: string;
  deviceId: string | null;
}

interface IdentificationType {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  thumbnail: string;
  secure_thumbnail: string;
}

interface Issuer {
  id: string;
  name: string;
}

export function SecureCardForm({ amount, onTokenCreated, onError, establishmentName }: SecureCardFormProps) {
  const { mp, isLoaded, isLoading, error: sdkError, deviceId, getIdentificationTypes, getPaymentMethods, getIssuers, createCardToken } = useMercadoPagoSDK();
  
  const [identificationTypes, setIdentificationTypes] = useState<IdentificationType[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [identificationType, setIdentificationType] = useState('CPF');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [selectedIssuerId, setSelectedIssuerId] = useState('');

  // Load identification types on mount
  useEffect(() => {
    if (isLoaded) {
      getIdentificationTypes()
        .then(types => {
          setIdentificationTypes(types);
          if (types.length > 0) {
            setIdentificationType(types[0].id);
          }
        })
        .catch(err => console.error('Error loading identification types:', err));
    }
  }, [isLoaded, getIdentificationTypes]);

  // Detect payment method from card number
  useEffect(() => {
    const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
    if (bin.length >= 6 && isLoaded) {
      getPaymentMethods(bin)
        .then(methods => {
          if (methods.length > 0) {
            setPaymentMethod(methods[0]);
            // Load issuers for this payment method
            getIssuers(methods[0].id, bin)
              .then(issuerList => {
                setIssuers(issuerList);
                if (issuerList.length > 0) {
                  setSelectedIssuerId(issuerList[0].id);
                }
              })
              .catch(err => console.error('Error loading issuers:', err));
          }
        })
        .catch(err => console.error('Error detecting payment method:', err));
    } else {
      setPaymentMethod(null);
      setIssuers([]);
    }
  }, [cardNumber, isLoaded, getPaymentMethods, getIssuers]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const formatExpirationDate = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return digits.substring(0, 2) + '/' + digits.substring(2, 4);
    }
    return digits;
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    }
    return value.substring(0, 14);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mp || !isLoaded) {
      onError('SDK do Mercado Pago não carregado');
      return;
    }

    setIsProcessing(true);

    try {
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      const [month, year] = expirationDate.split('/');
      const fullYear = year.length === 2 ? '20' + year : year;
      const cleanCPF = identificationNumber.replace(/\D/g, '');

      const token = await createCardToken({
        cardNumber: cleanCardNumber,
        cardholderName: cardholderName.toUpperCase(),
        cardExpirationMonth: month,
        cardExpirationYear: fullYear,
        securityCode,
        identificationType,
        identificationNumber: cleanCPF,
      });

      console.log('[SecureCardForm] Token created:', token.id);

      onTokenCreated({
        token: token.id,
        paymentMethodId: paymentMethod?.id || '',
        issuerId: selectedIssuerId,
        lastFourDigits: token.last_four_digits,
        cardholderName,
        deviceId,
      });
    } catch (err) {
      console.error('[SecureCardForm] Error:', err);
      onError(err instanceof Error ? err.message : 'Erro ao processar cartão');
    } finally {
      setIsProcessing(false);
    }
  };

  if (sdkError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Erro ao carregar SDK de pagamento: {sdkError}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando formulário seguro...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Pagamento com Cartão
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span>Dados protegidos com criptografia PCI-DSS</span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número do Cartão</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                required
                className="pr-12"
              />
              {paymentMethod && (
                <img 
                  src={paymentMethod.secure_thumbnail} 
                  alt={paymentMethod.name}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6"
                />
              )}
            </div>
          </div>

          {/* Expiration and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiration">Validade</Label>
              <Input
                id="expiration"
                placeholder="MM/AA"
                value={expirationDate}
                onChange={e => setExpirationDate(formatExpirationDate(e.target.value))}
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <div className="relative">
                <Input
                  id="cvv"
                  type="password"
                  placeholder="•••"
                  value={securityCode}
                  onChange={e => setSecurityCode(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  maxLength={4}
                  required
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Nome no Cartão</Label>
            <Input
              id="cardholderName"
              placeholder="Como está impresso no cartão"
              value={cardholderName}
              onChange={e => setCardholderName(e.target.value.toUpperCase())}
              required
            />
          </div>

          {/* Issuer Selection */}
          {issuers.length > 1 && (
            <div className="space-y-2">
              <Label>Banco Emissor</Label>
              <Select value={selectedIssuerId} onValueChange={setSelectedIssuerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {issuers.map(issuer => (
                    <SelectItem key={issuer.id} value={issuer.id}>
                      {issuer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Identification */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Documento</Label>
              <Select value={identificationType} onValueChange={setIdentificationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {identificationTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="identification">Número</Label>
              <Input
                id="identification"
                placeholder={identificationType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                value={identificationNumber}
                onChange={e => setIdentificationNumber(identificationType === 'CPF' ? formatCPF(e.target.value) : e.target.value)}
                required
              />
            </div>
          </div>

          {/* Amount Display */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total a pagar</span>
              <span className="text-xl font-bold text-primary">
                R$ {amount.toFixed(2)}
              </span>
            </div>
            {establishmentName && (
              <p className="text-xs text-muted-foreground mt-1">
                Pagamento para: {establishmentName}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Pagar R$ {amount.toFixed(2)}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default SecureCardForm;
