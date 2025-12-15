import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  QrCode, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Wallet
} from "lucide-react";
import { PaymentMethodsConfig as PaymentConfig } from "@/hooks/usePaymentConfig";

interface PaymentMethodsConfigProps {
  config: PaymentConfig;
  loading: boolean;
  saving: boolean;
  onConfigChange: (key: keyof PaymentConfig, value: boolean) => void;
}

const PAYMENT_METHODS = [
  {
    key: 'pix' as const,
    label: 'PIX',
    description: 'Pagamento instantâneo via QR Code',
    icon: QrCode,
    requiresGateway: true,
  },
  {
    key: 'credit_card' as const,
    label: 'Cartão de Crédito',
    description: 'Via Mercado Pago (parcelado)',
    icon: CreditCard,
    requiresGateway: true,
  },
  {
    key: 'debit_card' as const,
    label: 'Cartão de Débito',
    description: 'Via Mercado Pago',
    icon: Wallet,
    requiresGateway: true,
  },
  {
    key: 'cash' as const,
    label: 'Dinheiro',
    description: 'Pagamento em espécie na entrega',
    icon: Banknote,
    requiresGateway: false,
  },
  {
    key: 'card_on_delivery' as const,
    label: 'Maquininha na Entrega',
    description: 'Cartão físico com o entregador',
    icon: CreditCard,
    requiresGateway: false,
  },
  {
    key: 'pix_on_delivery' as const,
    label: 'PIX na Entrega',
    description: 'QR Code do entregador',
    icon: Smartphone,
    requiresGateway: false,
  },
];

export function PaymentMethodsConfig({ 
  config, 
  loading, 
  saving,
  onConfigChange 
}: PaymentMethodsConfigProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pagamento</CardTitle>
        <CardDescription>
          Escolha quais formas de pagamento deseja aceitar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isEnabled = config[method.key];
          
          return (
            <div 
              key={method.key}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                isEnabled 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-medium text-sm ${!isEnabled && 'text-muted-foreground'}`}>
                    {method.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {method.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => onConfigChange(method.key, checked)}
                disabled={saving}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
