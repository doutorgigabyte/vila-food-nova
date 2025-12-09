import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, QrCode, Link, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QRCodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEstablishmentFound: (establishmentId: string, establishmentName: string) => void;
}

export const QRCodeScanner = ({ open, onOpenChange, onEstablishmentFound }: QRCodeScannerProps) => {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualLink, setManualLink] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Extract establishment slug from URL
  const extractSlugFromUrl = (url: string): string | null => {
    try {
      // Patterns: /loja/slug, /cardapio/slug, subdomain.domain.com
      const patterns = [
        /\/loja\/([a-zA-Z0-9-_]+)/,
        /\/cardapio\/([a-zA-Z0-9-_]+)/,
        /^https?:\/\/([a-zA-Z0-9-_]+)\./
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const findEstablishmentBySlug = async (slug: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('id, name, slug')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        toast({
          title: "Estabelecimento não encontrado",
          description: "Verifique o link e tente novamente",
          variant: "destructive"
        });
        return;
      }

      onEstablishmentFound(data.id, data.name);
      onOpenChange(false);
    } catch (error) {
      console.error('Error finding establishment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar o estabelecimento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    const slug = extractSlugFromUrl(manualLink) || manualLink.trim();
    if (!slug) {
      toast({
        title: "Link inválido",
        description: "Cole o link do cardápio digital ou o slug do estabelecimento",
        variant: "destructive"
      });
      return;
    }
    findEstablishmentBySlug(slug);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode('camera');
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Erro de câmera",
        description: "Não foi possível acessar a câmera",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      setMode('manual');
      setManualLink('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Vincular a Estabelecimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'manual' ? (
            <>
              <div className="space-y-2">
                <Label>Link do cardápio digital</Label>
                <Input
                  placeholder="https://vilafood.delivery/loja/nome-da-loja"
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link do cardápio digital ou digite o slug do estabelecimento
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={startCamera}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Usar Câmera
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleManualSubmit}
                  disabled={loading || !manualLink.trim()}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4 mr-2" />
                  )}
                  Buscar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Aponte para o QR Code do cardápio digital
              </p>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  stopCamera();
                  setMode('manual');
                }}
              >
                Inserir link manualmente
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
