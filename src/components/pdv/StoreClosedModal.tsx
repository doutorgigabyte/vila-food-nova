import { Clock, Store, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StoreClosedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStore: () => void;
  loading?: boolean;
  storeName?: string;
}

export function StoreClosedModal({
  isOpen,
  onClose,
  onOpenStore,
  loading = false,
  storeName = "Estabelecimento",
}: StoreClosedModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Loja Fechada
          </DialogTitle>
          <DialogDescription className="pt-2">
            <strong>{storeName}</strong> está marcada como fechada. 
            Vendas realizadas com a loja fechada não serão contabilizadas corretamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <Clock className="w-8 h-8 text-orange-500 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Deseja abrir a loja agora?</p>
            <p className="text-muted-foreground">
              Isso permitirá registrar vendas e pedidos normalmente.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar Venda
          </Button>
          <Button onClick={onOpenStore} disabled={loading} className="gap-2">
            <Store className="w-4 h-4" />
            {loading ? "Abrindo..." : "Abrir Loja e Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
