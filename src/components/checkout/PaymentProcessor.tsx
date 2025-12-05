/**
 * PaymentProcessor - Processador de pagamentos integrado ao checkout
 * Suporta PIX, Cartão de Crédito/Débito via Mercado Pago
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PixPayment } from './PixPayment';
import {
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { PaymentStatus } from '@/lib/payment';

interface PaymentProcessorProps {
  orderId: string;
  establishmentId: string;
  amount: number;
  paymentMethod: 'pix' | 'credit' | 'debit' | 'cash';
  payerEmail?: string;
  payerName?: string;
  onPaymentComplete: () => void;
  onPaymentFailed: (error: string) => void;
  onCancel: () => void;
}

export function PaymentProcessor({
  orderId,
  establishmentId,
  amount,
  paymentMethod,
  payerEmail,
  payerName,
  onPaymentComplete,
  onPaymentFailed,
  onCancel,
}: PaymentProcessorProps) {
  const [status, setStatus] = useState<'processing' | 'waiting' | 'completed' | 'failed'>('processing');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Log payment audit
  const logPaymentAudit = async (action: string, details: Record<string, any>) => {
    try {
      await supabase.from('audit_logs').insert({
        action,
        entity_type: 'payment',
        entity_id: orderId,
        metadata: {
          payment_method: paymentMethod,
          amount,
          establishment_id: establishmentId,
          ...details,
        },
      });
    } catch (error) {
      console.error('Error logging payment audit:', error);
    }
  };

  useEffect(() => {
    logPaymentAudit('payment_initiated', { payment_method: paymentMethod });
  }, []);

  const handlePixComplete = async (pId: string) => {
    setPaymentId(pId);
    setStatus('completed');
    await logPaymentAudit('payment_completed', { payment_id: pId, status: 'approved' });
    
    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId);
    
    // Record transaction
    await supabase.from('mp_transactions').insert({
      establishment_id: establishmentId,
      type: 'sale',
      status: 'approved',
      amount,
      mp_payment_id: pId,
      payer_email: payerEmail,
      payer_name: payerName,
      metadata: { order_id: orderId, payment_method: 'pix' },
    });

    onPaymentComplete();
  };

  const handlePixFailed = async (error: string) => {
    setStatus('failed');
    await logPaymentAudit('payment_failed', { error, status: 'failed' });
    onPaymentFailed(error);
  };

  // For cash/card on delivery - just mark as pending payment
  const handleOfflinePayment = async () => {
    setStatus('processing');
    
    try {
      await logPaymentAudit('payment_pending', { 
        payment_method: paymentMethod,
        note: 'Pagamento será realizado na entrega/retirada' 
      });

      // Record pending transaction for tracking
      await supabase.from('mp_transactions').insert({
        establishment_id: establishmentId,
        type: 'sale',
        status: 'pending',
        amount,
        payer_email: payerEmail,
        payer_name: payerName,
        metadata: { 
          order_id: orderId, 
          payment_method: paymentMethod,
          offline_payment: true 
        },
      });

      setStatus('completed');
      onPaymentComplete();
    } catch (error) {
      setStatus('failed');
      onPaymentFailed('Erro ao processar pagamento');
    }
  };

  // PIX Payment
  if (paymentMethod === 'pix') {
    return (
      <div className="space-y-4">
        <PixPayment
          orderId={orderId}
          establishmentId={establishmentId}
          amount={amount}
          payerEmail={payerEmail}
          payerName={payerName}
          onPaymentComplete={handlePixComplete}
          onPaymentFailed={handlePixFailed}
        />
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    );
  }

  // Card/Cash - Offline payment (payment on delivery)
  if (paymentMethod === 'credit' || paymentMethod === 'debit' || paymentMethod === 'cash') {
    if (status === 'completed') {
      return (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <p className="text-xl font-bold text-green-600">Pedido Confirmado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {paymentMethod === 'cash' 
                  ? 'Pagamento será realizado na entrega/retirada'
                  : 'Pagamento com cartão será realizado na entrega/retirada'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paymentMethod === 'cash' ? (
              <Banknote className="h-5 w-5 text-primary" />
            ) : (
              <CreditCard className="h-5 w-5 text-primary" />
            )}
            {paymentMethod === 'cash' ? 'Pagamento em Dinheiro' : `Cartão de ${paymentMethod === 'credit' ? 'Crédito' : 'Débito'}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="font-medium">Valor a pagar</p>
            <p className="text-3xl font-bold text-primary mt-2">
              R$ {amount.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              {paymentMethod === 'cash'
                ? 'Tenha o valor em mãos para pagamento na entrega/retirada'
                : 'Tenha seu cartão pronto para pagamento na entrega/retirada'
              }
            </p>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleOfflinePayment}
            disabled={status === 'processing'}
          >
            {status === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Confirmar Pedido'
            )}
          </Button>

          <Button variant="outline" className="w-full" onClick={onCancel}>
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Fallback
  return (
    <Card className="border-destructive">
      <CardContent className="pt-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <div>
          <p className="font-medium text-destructive">Método de pagamento não suportado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Por favor, selecione outra forma de pagamento
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Voltar
        </Button>
      </CardContent>
    </Card>
  );
}
