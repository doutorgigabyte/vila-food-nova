import { useState } from "react";
import { ExternalLink, QrCode, X, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DOMAIN } from "@/lib/constants";

interface QuickAccessButtonsProps {
  establishmentSlug: string;
  establishmentName: string;
}

export function QuickAccessButtons({ establishmentSlug, establishmentName }: QuickAccessButtonsProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const storeUrl = `https://${establishmentSlug}.${DOMAIN}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=H&data=${encodeURIComponent(storeUrl)}`;
  
  const handleVisitStore = () => {
    window.open(storeUrl, '_blank');
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };
  
  const handleDownloadQR = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      toast.error("Erro ao gerar imagem");
      return;
    }
    
    const qrImage = new Image();
    qrImage.crossOrigin = "anonymous";
    
    qrImage.onload = () => {
      ctx.drawImage(qrImage, 0, 0, 300, 300);
      
      const logo = new Image();
      logo.src = "/images/qrcode-logo.png";
      
      logo.onload = () => {
        const logoSize = 60;
        const logoX = (300 - logoSize) / 2;
        const logoY = (300 - logoSize) / 2;
        
        ctx.fillStyle = "white";
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `qrcode-${establishmentSlug}.png`;
            link.click();
            window.URL.revokeObjectURL(downloadUrl);
            toast.success("QR Code baixado!");
          }
        }, "image/png");
      };
    };
    
    qrImage.src = qrCodeUrl;
  };
  
  const QRCodeWithLogo = () => (
    <div className="relative inline-block">
      <img
        src={qrCodeUrl}
        alt={`QR Code - ${establishmentName}`}
        className="w-64 h-64"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white p-1.5 rounded">
          <img
            src="/images/qrcode-logo.png"
            alt="Logo"
            className="w-12 h-12"
          />
        </div>
      </div>
    </div>
  );
  
  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleVisitStore}
          className="gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">Visitar Loja</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQRModal(true)}
          className="gap-2"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">QR Code</span>
        </Button>
      </div>
      
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code do Cardápio</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-xl shadow-inner">
              <QRCodeWithLogo />
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Escaneie para acessar o cardápio digital de<br />
              <strong>{establishmentName}</strong>
            </p>
            
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                type="text"
                value={storeUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg truncate"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <Button onClick={handleDownloadQR} className="w-full max-w-xs gap-2">
              <Download className="w-4 h-4" />
              Baixar QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}