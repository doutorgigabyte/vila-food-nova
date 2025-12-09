import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  User, 
  Phone, 
  Bike,
  Car,
  CheckCircle2, 
  XCircle,
  Clock,
  Settings
} from 'lucide-react';
import { useEstablishmentDriverLinks, DriverEstablishmentLink } from '@/hooks/useDriverEstablishmentLinks';
import { Skeleton } from '@/components/ui/skeleton';

interface DriverLinkRequestsProps {
  establishmentId: string;
}

export const DriverLinkRequests = ({ establishmentId }: DriverLinkRequestsProps) => {
  const { 
    links, 
    loading, 
    updateLinkStatus,
    pendingLinks,
    approvedLinks 
  } = useEstablishmentDriverLinks(establishmentId);
  
  const [configDialog, setConfigDialog] = useState<DriverEstablishmentLink | null>(null);
  const [commissionType, setCommissionType] = useState<'external' | 'fixed' | 'percentage'>('external');
  const [fixedFee, setFixedFee] = useState('');
  const [percentageFee, setPercentageFee] = useState('');

  const handleApprove = (link: DriverEstablishmentLink) => {
    setConfigDialog(link);
    setCommissionType('external');
    setFixedFee('');
    setPercentageFee('');
  };

  const confirmApprove = async () => {
    if (!configDialog) return;
    
    await updateLinkStatus(configDialog.id, 'approved', {
      commission_type: commissionType,
      fixed_fee: commissionType === 'fixed' ? parseFloat(fixedFee) : undefined,
      percentage_fee: commissionType === 'percentage' ? parseFloat(percentageFee) : undefined
    });
    
    setConfigDialog(null);
  };

  const getVehicleIcon = (type: string | null) => {
    return type === 'car' ? Car : Bike;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entregadores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Entregadores Vinculados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLinks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Solicitações Pendentes ({pendingLinks.length})
              </h4>
              <div className="space-y-2">
                {pendingLinks.map(link => {
                  const VehicleIcon = getVehicleIcon(link.driver?.vehicle_type || null);
                  return (
                    <div 
                      key={link.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{link.driver?.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {link.driver?.phone}
                          <VehicleIcon className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => updateLinkStatus(link.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApprove(link)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {approvedLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Aprovados ({approvedLinks.length})
              </h4>
              <div className="space-y-2">
                {approvedLinks.map(link => {
                  const VehicleIcon = getVehicleIcon(link.driver?.vehicle_type || null);
                  return (
                    <div 
                      key={link.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{link.driver?.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <VehicleIcon className="w-3 h-3" />
                          <Badge variant="secondary" className="text-xs">
                            {link.commission_type === 'external' && 'Pago por fora'}
                            {link.commission_type === 'fixed' && `R$ ${link.fixed_fee?.toFixed(2)}/entrega`}
                            {link.commission_type === 'percentage' && `${link.percentage_fee}% do frete`}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => updateLinkStatus(link.id, 'blocked')}
                      >
                        Bloquear
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {links.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum entregador vinculado</p>
              <p className="text-xs mt-1">
                Entregadores podem escanear o QR Code do seu cardápio para solicitar vínculo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Configuration Dialog */}
      <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurar Pagamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Como você quer pagar <strong>{configDialog?.driver?.name}</strong>?
            </p>

            <RadioGroup value={commissionType} onValueChange={(v) => setCommissionType(v as typeof commissionType)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="external" id="external" />
                <Label htmlFor="external" className="flex-1 cursor-pointer">
                  <span className="font-medium">Pago por fora</span>
                  <p className="text-xs text-muted-foreground">
                    Você acerta diretamente com o entregador
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="flex-1 cursor-pointer">
                  <span className="font-medium">Valor fixo por entrega</span>
                  <p className="text-xs text-muted-foreground">
                    Sempre o mesmo valor independente da distância
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="flex-1 cursor-pointer">
                  <span className="font-medium">Porcentagem do frete</span>
                  <p className="text-xs text-muted-foreground">
                    Entregador recebe % do valor cobrado do cliente
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {commissionType === 'fixed' && (
              <div className="space-y-2">
                <Label>Valor por entrega (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="5.00"
                  value={fixedFee}
                  onChange={(e) => setFixedFee(e.target.value)}
                />
              </div>
            )}

            {commissionType === 'percentage' && (
              <div className="space-y-2">
                <Label>Porcentagem do frete (%)</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="80"
                  value={percentageFee}
                  onChange={(e) => setPercentageFee(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ex: Se o frete for R$ 10,00 e você colocar 80%, o entregador recebe R$ 8,00
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmApprove}>
              Aprovar Entregador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
