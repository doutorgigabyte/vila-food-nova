import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Plus
} from 'lucide-react';
import { useDriverLinks } from '@/hooks/useDriverEstablishmentLinks';
import { QRCodeScanner } from './QRCodeScanner';
import { Skeleton } from '@/components/ui/skeleton';

interface LinkedEstablishmentsProps {
  driverId: string;
}

export const LinkedEstablishments = ({ driverId }: LinkedEstablishmentsProps) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const { links, loading, linkToEstablishment, approvedLinks, pendingLinks } = useDriverLinks(driverId);

  const handleEstablishmentFound = async (establishmentId: string, establishmentName: string) => {
    await linkToEstablishment(establishmentId, 'qr_code');
  };

  const statusConfig = {
    pending: { label: 'Aguardando', icon: Clock, color: 'bg-yellow-500/10 text-yellow-600' },
    approved: { label: 'Aprovado', icon: CheckCircle2, color: 'bg-green-500/10 text-green-600' },
    rejected: { label: 'Rejeitado', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
    blocked: { label: 'Bloqueado', icon: XCircle, color: 'bg-destructive/10 text-destructive' }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estabelecimentos Vinculados</CardTitle>
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Estabelecimentos</CardTitle>
          <Button size="sm" onClick={() => setScannerOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Vincular
          </Button>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-6">
              <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Você ainda não está vinculado a nenhum estabelecimento
              </p>
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <QrCode className="w-4 h-4 mr-2" />
                Escanear QR Code
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map(link => {
                const status = statusConfig[link.status];
                const StatusIcon = status.icon;
                
                return (
                  <div 
                    key={link.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    {link.establishment?.logo_url ? (
                      <img 
                        src={link.establishment.logo_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Store className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {link.establishment?.name || 'Estabelecimento'}
                      </p>
                      <Badge variant="secondary" className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {approvedLinks.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Você receberá entregas de {approvedLinks.length} estabelecimento(s)
            </p>
          )}
        </CardContent>
      </Card>

      <QRCodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onEstablishmentFound={handleEstablishmentFound}
      />
    </>
  );
};
