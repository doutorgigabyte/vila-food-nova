import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { 
  MapPin, 
  Plus, 
  Star, 
  Trash2, 
  Home, 
  Building, 
  Heart,
  Edit2
} from "lucide-react";
import { SavedAddress, useSavedAddresses } from "@/hooks/useSavedAddresses";
import { cn } from "@/lib/utils";

interface SavedAddressSelectorProps {
  onSelect: (address: SavedAddress) => void;
  onAddNew: () => void;
  selectedId?: string;
}

const labelIcons: Record<string, typeof Home> = {
  "Casa": Home,
  "Trabalho": Building,
  "Favorito": Heart,
};

export const SavedAddressSelector = ({ 
  onSelect, 
  onAddNew,
  selectedId 
}: SavedAddressSelectorProps) => {
  const { addresses, loading, deleteAddress, setDefaultAddress } = useSavedAddresses();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <Card className="p-6 text-center border-dashed">
        <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">Nenhum endereço salvo</p>
        <Button onClick={onAddNew} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar endereço
        </Button>
      </Card>
    );
  }

  const handleDelete = async () => {
    if (addressToDelete) {
      await deleteAddress(addressToDelete);
      setAddressToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSetDefault = async (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await setDefaultAddress(addressId);
  };

  return (
    <div className="space-y-3">
      <RadioGroup 
        value={selectedId} 
        onValueChange={(id) => {
          const address = addresses.find(a => a.id === id);
          if (address) onSelect(address);
        }}
      >
        {addresses.map((address) => {
          const IconComponent = labelIcons[address.label] || MapPin;
          
          return (
            <div key={address.id} className="relative">
              <Label
                htmlFor={address.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                  "hover:bg-muted/50",
                  selectedId === address.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border"
                )}
              >
                <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="w-4 h-4 text-primary" />
                    <span className="font-medium">{address.label}</span>
                    {address.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {address.address}, {address.number}
                    {address.complement && ` - ${address.complement}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {!address.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleSetDefault(address.id, e)}
                      title="Definir como padrão"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddressToDelete(address.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      <Button 
        variant="outline" 
        className="w-full" 
        onClick={onAddNew}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar novo endereço
      </Button>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O endereço será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
