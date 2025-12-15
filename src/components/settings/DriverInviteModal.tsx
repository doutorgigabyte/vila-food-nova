import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDriverInvitation } from "@/hooks/useDriverInvitation";
import { toast } from "sonner";
import { 
  Copy, 
  Check, 
  RefreshCw, 
  Link2, 
  QrCode,
  Clock,
  Trash2
} from "lucide-react";
import { QRCode } from "react-qrcode-logo";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DriverInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  establishmentName?: string;
}

export const DriverInviteModal = ({ 
  open, 
  onOpenChange,
  establishmentId,
  establishmentName 
}: DriverInviteModalProps) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const { 
    loading, 
    currentToken, 
    createInvitation, 
    getActiveInvitation,
    invalidateToken,
    getInvitationUrl 
  } = useDriverInvitation(establishmentId);

  useEffect(() => {
    if (open && establishmentId) {
      getActiveInvitation();
    }
  }, [open, establishmentId, getActiveInvitation]);

  const handleCreateNew = async () => {
    await createInvitation();
    setShowQR(false);
  };

  const handleCopyLink = () => {
    if (!currentToken) return;
    
    const url = getInvitationUrl(currentToken.token);
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado!");
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvalidate = async () => {
    if (!currentToken) return;
    await invalidateToken(currentToken.id);
  };

  const inviteUrl = currentToken ? getInvitationUrl(currentToken.token) : '';
  const expiresIn = currentToken 
    ? formatDistanceToNow(new Date(currentToken.expires_at), { locale: ptBR, addSuffix: true })
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Convidar Entregador
          </DialogTitle>
          <DialogDescription>
            Gere um link de convite para entregadores se cadastrarem e vincularem 
            automaticamente ao seu estabelecimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : currentToken ? (
            <>
              {/* Token Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Link de convite</Label>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Expira {expiresIn}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    value={inviteUrl} 
                    readOnly 
                    className="text-xs font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* QR Code Toggle */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowQR(!showQR)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                {showQR ? 'Ocultar QR Code' : 'Mostrar QR Code'}
              </Button>

              {showQR && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCode
                    value={inviteUrl}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    ecLevel="H"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleInvalidate}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Invalidar
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleCreateNew}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Novo
                </Button>
              </div>

              {/* Info */}
              <p className="text-xs text-muted-foreground text-center">
                O entregador que se cadastrar usando este link será 
                vinculado automaticamente a <strong>{establishmentName || "sua loja"}</strong> 
                {" "}com status pendente de aprovação.
              </p>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Link2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Nenhum convite ativo</p>
                <p className="text-sm text-muted-foreground">
                  Gere um link para convidar entregadores
                </p>
              </div>
              <Button onClick={handleCreateNew} disabled={loading}>
                <Link2 className="w-4 h-4 mr-2" />
                Gerar Link de Convite
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
