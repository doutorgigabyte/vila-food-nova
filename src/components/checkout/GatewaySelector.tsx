/**
 * GatewaySelector - Componente para selecionar gateway de pagamento no checkout
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, QrCode, Banknote, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export type GatewayProvider = 'mercadopago' | 'pagseguro' | 'manual';

interface GatewayOption {
  id: GatewayProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  methods: string[];
}

interface GatewaySelectorProps {
  establishmentId: string;
  selectedGateway: GatewayProvider;
  onGatewayChange: (gateway: GatewayProvider) => void;
}

export function GatewaySelector({
  establishmentId,
  selectedGateway,
  onGatewayChange,
}: GatewaySelectorProps) {
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState<GatewayOption[]>([]);

  useEffect(() => {
    fetchAvailableGateways();
  }, [establishmentId]);

  const fetchAvailableGateways = async () => {
    setLoading(true);
    try {
      // Fetch establishment payment config
      const { data: establishment, error } = await supabase
        .from('establishments')
        .select('mercado_pago_token, pagseguro_token, pix_key')
        .eq('id', establishmentId)
        .single();

      if (error) {
        console.error('[GatewaySelector] Error fetching establishment:', error);
        return;
      }

      const availableGateways: GatewayOption[] = [];

      // Mercado Pago
      if (establishment?.mercado_pago_token) {
        availableGateways.push({
          id: 'mercadopago',
          name: 'Mercado Pago',
          description: 'PIX instantâneo com QR Code',
          icon: <QrCode className="h-5 w-5 text-[#009ee3]" />,
          available: true,
          methods: ['PIX', 'Cartão'],
        });
      }

      // PagSeguro
      if (establishment?.pagseguro_token) {
        availableGateways.push({
          id: 'pagseguro',
          name: 'PagSeguro',
          description: 'PIX e cartões via PagBank',
          icon: <Building2 className="h-5 w-5 text-[#00a859]" />,
          available: true,
          methods: ['PIX', 'Cartão'],
        });
      }

      // PIX estático (fallback)
      if (establishment?.pix_key && !establishment?.mercado_pago_token) {
        availableGateways.push({
          id: 'manual',
          name: 'PIX Manual',
          description: 'Copie a chave PIX e pague',
          icon: <Banknote className="h-5 w-5 text-primary" />,
          available: true,
          methods: ['PIX'],
        });
      }

      // Sempre adicionar dinheiro
      if (availableGateways.length === 0) {
        availableGateways.push({
          id: 'manual',
          name: 'Pagamento na Entrega',
          description: 'Pague em dinheiro ou cartão na entrega',
          icon: <Banknote className="h-5 w-5 text-primary" />,
          available: true,
          methods: ['Dinheiro', 'Cartão na entrega'],
        });
      }

      setGateways(availableGateways);

      // Auto-select first gateway if only one available
      if (availableGateways.length === 1) {
        onGatewayChange(availableGateways[0].id);
      } else if (availableGateways.length > 0 && !selectedGateway) {
        onGatewayChange(availableGateways[0].id);
      }

      console.log('[GatewaySelector] Available gateways:', availableGateways.map(g => g.id));
    } catch (error) {
      console.error('[GatewaySelector] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // If only one gateway, don't show selector
  if (gateways.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Processador de Pagamento</Label>
      <RadioGroup
        value={selectedGateway}
        onValueChange={(value) => onGatewayChange(value as GatewayProvider)}
        className="space-y-2"
      >
        {gateways.map((gateway) => (
          <Card
            key={gateway.id}
            className={`cursor-pointer transition-all ${
              selectedGateway === gateway.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onGatewayChange(gateway.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <RadioGroupItem value={gateway.id} id={gateway.id} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {gateway.icon}
                    <Label htmlFor={gateway.id} className="font-medium cursor-pointer">
                      {gateway.name}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {gateway.description}
                  </p>
                </div>
                <div className="flex gap-1">
                  {gateway.methods.map((method) => (
                    <Badge key={method} variant="secondary" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
}
