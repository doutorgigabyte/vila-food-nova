import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDeliveryConfig, DeliveryConfig } from "@/hooks/useDeliveryConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Truck, 
  MapPin, 
  Calculator, 
  Wallet, 
  Clock, 
  Users,
  Save,
  Info
} from "lucide-react";

interface DeliveryConfigTabProps {
  establishmentId: string | null;
}

export const DeliveryConfigTab = ({ establishmentId }: DeliveryConfigTabProps) => {
  const { config, loading, saving, saveConfig } = useDeliveryConfig(establishmentId);
  const [localConfig, setLocalConfig] = useState<DeliveryConfig | null>(null);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleSave = () => {
    if (localConfig) {
      saveConfig(localConfig);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!localConfig) return null;

  return (
    <div className="space-y-6">
      {/* Calculation Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Método de Cálculo do Frete
          </CardTitle>
          <CardDescription>
            Escolha como o valor da entrega será calculado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={localConfig.calculation_method}
            onValueChange={(value) => setLocalConfig({ ...localConfig, calculation_method: value as 'zone' | 'km' })}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="zone" id="zone" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="zone" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="w-4 h-4 text-primary" />
                  Por Bairro/Zona
                  <Badge variant="secondary">Recomendado</Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Defina valores fixos para cada bairro ou zona de entrega. 
                  Configure na aba "Taxas de Entrega".
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="km" id="km" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="km" className="flex items-center gap-2 cursor-pointer">
                  <Truck className="w-4 h-4 text-primary" />
                  Por Quilômetro
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  O sistema calcula automaticamente a distância via GPS e aplica a taxa por km.
                </p>
              </div>
            </div>
          </RadioGroup>

          {localConfig.calculation_method === 'km' && (
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="base_fee">Taxa Base (R$)</Label>
                <Input
                  id="base_fee"
                  type="number"
                  step="0.01"
                  value={localConfig.base_fee}
                  onChange={(e) => setLocalConfig({ ...localConfig, base_fee: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Valor fixo cobrado em todas as entregas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee_per_km">Taxa por KM (R$)</Label>
                <Input
                  id="fee_per_km"
                  type="number"
                  step="0.01"
                  value={localConfig.fee_per_km}
                  onChange={(e) => setLocalConfig({ ...localConfig, fee_per_km: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Valor adicional por cada km de distância
                </p>
              </div>
            </div>
          )}

          {localConfig.calculation_method === 'km' && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Exemplo de Cálculo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Entrega a 5 km: R$ {localConfig.base_fee.toFixed(2)} + (5 × R$ {localConfig.fee_per_km.toFixed(2)}) = 
                <span className="font-bold text-foreground ml-1">
                  R$ {(localConfig.base_fee + 5 * localConfig.fee_per_km).toFixed(2)}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Commission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Comissão do Entregador
          </CardTitle>
          <CardDescription>
            Configure quanto do valor do frete vai para o entregador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={localConfig.driver_commission_type}
            onValueChange={(value) => setLocalConfig({ ...localConfig, driver_commission_type: value as 'percentage' | 'fixed' })}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="percentage" id="percentage" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="percentage" className="cursor-pointer">
                  Porcentagem do Frete
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  O entregador recebe uma % do valor do frete
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="fixed" className="cursor-pointer">
                  Valor Fixo
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  O entregador recebe um valor fixo por entrega
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="commission_value">
              {localConfig.driver_commission_type === 'percentage' ? 'Porcentagem (%)' : 'Valor Fixo (R$)'}
            </Label>
            <Input
              id="commission_value"
              type="number"
              step={localConfig.driver_commission_type === 'percentage' ? '1' : '0.01'}
              value={localConfig.driver_commission_value}
              onChange={(e) => setLocalConfig({ ...localConfig, driver_commission_value: Number(e.target.value) })}
              className="max-w-[200px]"
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Exemplo de Divisão</span>
            </div>
            {localConfig.driver_commission_type === 'percentage' ? (
              <p className="text-sm text-muted-foreground">
                Frete de R$ 10,00: Entregador recebe 
                <span className="font-bold text-foreground mx-1">
                  R$ {(10 * localConfig.driver_commission_value / 100).toFixed(2)}
                </span>
                ({localConfig.driver_commission_value}%) | Estabelecimento fica com 
                <span className="font-bold text-foreground ml-1">
                  R$ {(10 * (100 - localConfig.driver_commission_value) / 100).toFixed(2)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Entregador recebe 
                <span className="font-bold text-foreground mx-1">
                  R$ {localConfig.driver_commission_value.toFixed(2)}
                </span>
                fixo por entrega
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pagamento Automático
          </CardTitle>
          <CardDescription>
            Configure o pagamento automático dos entregadores via PIX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Habilitar Pagamento Automático</p>
              <p className="text-sm text-muted-foreground">
                O sistema processa pagamentos automaticamente
              </p>
            </div>
            <Switch
              checked={localConfig.auto_payout}
              onCheckedChange={(checked) => setLocalConfig({ ...localConfig, auto_payout: checked })}
            />
          </div>

          {localConfig.auto_payout && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payout_frequency">Frequência de Pagamento</Label>
                <Select
                  value={localConfig.payout_frequency}
                  onValueChange={(value) => setLocalConfig({ 
                    ...localConfig, 
                    payout_frequency: value as 'daily' | 'weekly' | 'biweekly' | 'monthly' 
                  })}
                >
                  <SelectTrigger id="payout_frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_payout">Valor Mínimo para Saque (R$)</Label>
                <Input
                  id="min_payout"
                  type="number"
                  step="0.01"
                  value={localConfig.min_payout_amount}
                  onChange={(e) => setLocalConfig({ ...localConfig, min_payout_amount: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};
