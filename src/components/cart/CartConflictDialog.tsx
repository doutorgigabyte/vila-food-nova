import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CartConflictDialogProps {
  isOpen: boolean;
  currentEstablishment?: string;
  newEstablishment?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CartConflictDialog({
  isOpen,
  currentEstablishment,
  newEstablishment,
  onConfirm,
  onCancel,
}: CartConflictDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Trocar de estabelecimento?</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem itens de <strong>{currentEstablishment}</strong> no carrinho. 
            Deseja esvaziar e adicionar produtos de <strong>{newEstablishment}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Esvaziar e Adicionar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
