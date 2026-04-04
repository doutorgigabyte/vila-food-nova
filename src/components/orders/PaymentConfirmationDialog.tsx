import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Order {
  id: string;
  order_number: number;
  total?: number;
  payment_method?: string;
  customer_name?: string;
}

interface PaymentConfirmationDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (orderId: string, amount: number) => Promise<void>;
  isLoading?: boolean;
}

const getPaymentMethodLabel = (method?: string) => {
  if (!method) return 'Não informado';
  const labels: Record<string, string> = {
    cash: '💵 Dinheiro',
    card_on_delivery: '💳 Cartão na Entrega',
    pix_on_delivery: '📱 PIX na Entrega',
  };
  return labels[method] || method;
};

export function PaymentConfirmationDialog({
  order,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: PaymentConfirmationDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!order || !confirmed || !order.total) return;
    await onConfirm(order.id, order.total);
    setConfirmed(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmed(false);
    }
    onOpenChange(newOpen);
  };

  if (!order) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            💰 Confirmar Recebimento de Pagamento
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedido</span>
                  <span className="font-semibold text-foreground">#{order.order_number}</span>
                </div>
                {order.customer_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="text-foreground">{order.customer_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forma de Pagamento</span>
                  <span className="text-foreground">{getPaymentMethodLabel(order.payment_method)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground font-medium">Total a Receber</span>
                  <span className="font-bold text-lg text-primary">
                    R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="payment-confirmed"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked === true)}
                />
                <Label
                  htmlFor="payment-confirmed"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Confirmo que recebi o pagamento deste pedido
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!confirmed || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              '✅ Confirmar e Finalizar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
