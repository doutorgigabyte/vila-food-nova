import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Store, CreditCard, QrCode, Banknote, Smartphone } from "lucide-react";
import { EstablishmentInfo } from "@/hooks/useCart";

export type PaymentMethodType = 'pix' | 'credit_card' | 'cash' | 'card_on_delivery' | 'pix_on_delivery';

export interface StorePayment {
  establishmentId: string;
  method: PaymentMethodType;
}

interface VilaPaymentSelectorProps {
  establishmentIds: string[];
  establishments: Record<string, EstablishmentInfo>;
  deliveryType: 'delivery' | 'pickup';
  onPaymentChange: (payments: StorePayment[]) => void;
}

const ONLINE_PAYMENT_OPTIONS = [
  { value: 'pix', label: 'PIX', icon: QrCode, description: 'Pagamento instantâneo' },
  { value: 'credit_card', label: 'Cartão', icon: CreditCard, description: 'Crédito ou débito' },
];

const DELIVERY_PAYMENT_OPTIONS = [
  { value: 'card_on_delivery', label: 'Maquineta', icon: Smartphone, description: 'Cartão na entrega' },
  { value: 'cash', label: 'Dinheiro', icon: Banknote, description: 'Pagar em espécie' },
  { value: 'pix_on_delivery', label: 'PIX na entrega', icon: QrCode, description: 'Pagar no local' },
];

export function VilaPaymentSelector({
  establishmentIds,
  establishments,
  deliveryType,
  onPaymentChange
}: VilaPaymentSelectorProps) {
  const [unifiedPayment, setUnifiedPayment] = useState(true);
  const [unifiedMethod, setUnifiedMethod] = useState<PaymentMethodType>(
    deliveryType === 'pickup' ? 'cash' : 'pix'
  );
  const [perStorePayments, setPerStorePayments] = useState<Record<string, PaymentMethodType>>(
    Object.fromEntries(establishmentIds.map(id => [id, deliveryType === 'pickup' ? 'cash' : 'pix']))
  );

  const paymentOptions = deliveryType === 'pickup' ? DELIVERY_PAYMENT_OPTIONS : ONLINE_PAYMENT_OPTIONS;
  const isMultiStore = establishmentIds.length > 1;

  const handleUnifiedChange = (value: string) => {
    setUnifiedMethod(value as PaymentMethodType);
    onPaymentChange(establishmentIds.map(id => ({ establishmentId: id, method: value as PaymentMethodType })));
  };

  const handlePerStoreChange = (estId: string, value: string) => {
    const updated = { ...perStorePayments, [estId]: value as PaymentMethodType };
    setPerStorePayments(updated);
    onPaymentChange(Object.entries(updated).map(([id, method]) => ({ establishmentId: id, method })));
  };

  const handleUnifiedToggle = (checked: boolean) => {
    setUnifiedPayment(checked);
    if (checked) {
      onPaymentChange(establishmentIds.map(id => ({ establishmentId: id, method: unifiedMethod })));
    } else {
      onPaymentChange(Object.entries(perStorePayments).map(([id, method]) => ({ establishmentId: id, method })));
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Forma de Pagamento
          </span>
          {isMultiStore && (
            <div className="flex items-center gap-2 text-sm font-normal">
              <Label htmlFor="unified-payment" className="text-muted-foreground">
                Mesmo método
              </Label>
              <Switch
                id="unified-payment"
                checked={unifiedPayment}
                onCheckedChange={handleUnifiedToggle}
              />
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deliveryType === 'pickup' && (
          <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
            Para retirada no local, o pagamento é feito diretamente na loja.
          </p>
        )}

        {unifiedPayment || !isMultiStore ? (
          <RadioGroup value={unifiedMethod} onValueChange={handleUnifiedChange} className="space-y-2">
            {paymentOptions.map(option => (
              <Label
                key={option.value}
                htmlFor={`unified-${option.value}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value={option.value} id={`unified-${option.value}`} />
                <option.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <span className="font-medium">{option.label}</span>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-4">
            {establishmentIds.map((estId, index) => (
              <div key={estId} className="space-y-2">
                {index > 0 && <div className="border-t border-border/30 pt-3" />}
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span>{establishments[estId]?.name || `Loja ${index + 1}`}</span>
                </div>
                <RadioGroup 
                  value={perStorePayments[estId]} 
                  onValueChange={(v) => handlePerStoreChange(estId, v)} 
                  className="space-y-2 pl-6"
                >
                  {paymentOptions.map(option => (
                    <Label
                      key={option.value}
                      htmlFor={`${estId}-${option.value}`}
                      className="flex items-center gap-3 p-2 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={option.value} id={`${estId}-${option.value}`} />
                      <option.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
