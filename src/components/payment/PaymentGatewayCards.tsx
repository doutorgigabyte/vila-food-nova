import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Settings, Clock } from "lucide-react";
import { MercadoPagoOAuth } from "./MercadoPagoOAuth";
import { PaymentMethodsConfig } from "./PaymentMethodsConfig";
import { usePaymentConfig, PaymentMethodsConfig as PaymentConfig } from "@/hooks/usePaymentConfig";
import mercadoPagoLogo from "@/assets/logos/mercado-pago.jpg";
import pagbankLogo from "@/assets/logos/pagbank.jpg";

interface PaymentGatewayCardsProps {
  establishmentId: string;
  onRefresh?: () => void;
}

export function PaymentGatewayCards({ establishmentId, onRefresh }: PaymentGatewayCardsProps) {
  const [showMpConfig, setShowMpConfig] = useState(false);
  const { config, loading, saving, isConnected, updateConfig, refetch } = usePaymentConfig(establishmentId);

  const handleConfigChange = (key: keyof PaymentConfig, value: boolean) => {
    updateConfig({ [key]: value });
  };

  const handleMpConnected = () => {
    refetch();
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* Gateway Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Mercado Pago Card */}
        <Card className={`relative overflow-hidden transition-all ${
          isConnected 
            ? 'border-green-500/30 bg-green-500/5' 
            : 'border-border hover:border-primary/30'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#009EE3]/10 flex items-center justify-center">
                  <img 
                    src={mercadoPagoLogo} 
                    alt="Mercado Pago" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">Mercado Pago</h3>
                  <p className="text-xs text-muted-foreground">
                    PIX, cartão de crédito e débito
                  </p>
                </div>
              </div>
              <Badge 
                variant={isConnected ? 'default' : 'secondary'}
                className={isConnected ? 'bg-green-600' : ''}
              >
                {isConnected ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Ativo</>
                ) : (
                  'Inativo'
                )}
              </Badge>
            </div>

            <Button 
              className="w-full"
              variant={isConnected ? 'outline' : 'default'}
              onClick={() => setShowMpConfig(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {isConnected ? 'Configurar' : 'Conectar'}
            </Button>
          </CardContent>
        </Card>

        {/* PagSeguro Card - Coming Soon */}
        <Card className="relative overflow-hidden border-border opacity-60">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FFC700]/10 flex items-center justify-center">
                  <img 
                    src={pagbankLogo} 
                    alt="PagBank" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">PagBank</h3>
                  <p className="text-xs text-muted-foreground">
                    PIX e cartões via PagBank
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                Em breve
              </Badge>
            </div>

            <Button className="w-full" variant="outline" disabled>
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Mercado Pago Config Dialog */}
      <Dialog open={showMpConfig} onOpenChange={setShowMpConfig}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img 
                src={mercadoPagoLogo} 
                alt="Mercado Pago" 
                className="w-6 h-6 object-contain"
              />
              Configurar Mercado Pago
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* OAuth Connection */}
            <MercadoPagoOAuth 
              establishmentId={establishmentId}
              onConnected={handleMpConnected}
            />

            {/* Payment Methods Config - Only show if connected */}
            {isConnected && (
              <PaymentMethodsConfig
                config={config}
                loading={loading}
                saving={saving}
                onConfigChange={handleConfigChange}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
