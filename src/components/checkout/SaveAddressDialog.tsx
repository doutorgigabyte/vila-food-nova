import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Building, Heart, MapPin, Bookmark } from "lucide-react";
import { useSavedAddresses, SavedAddress } from "@/hooks/useSavedAddresses";

interface SaveAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressData: {
    cep: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    reference?: string;
    lat?: number;
    lng?: number;
    formatted_address?: string;
  };
  onSaved?: () => void;
}

const labelOptions = [
  { value: "Casa", icon: Home, label: "Casa" },
  { value: "Trabalho", icon: Building, label: "Trabalho" },
  { value: "Favorito", icon: Heart, label: "Favorito" },
  { value: "Outro", icon: MapPin, label: "Outro" },
];

export const SaveAddressDialog = ({
  open,
  onOpenChange,
  addressData,
  onSaved,
}: SaveAddressDialogProps) => {
  const { saveAddress, isAuthenticated } = useSavedAddresses();
  const [label, setLabel] = useState("Casa");
  const [customLabel, setCustomLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!isAuthenticated) return;

    setSaving(true);
    const finalLabel = label === "Outro" ? customLabel || "Endereço" : label;

    const success = await saveAddress({
      label: finalLabel,
      cep: addressData.cep,
      address: addressData.address,
      number: addressData.number,
      complement: addressData.complement || "",
      neighborhood: addressData.neighborhood,
      city: addressData.city,
      state: addressData.state,
      reference: addressData.reference || "",
      lat: addressData.lat,
      lng: addressData.lng,
      formatted_address: addressData.formatted_address,
    });

    setSaving(false);
    if (success) {
      onOpenChange(false);
      onSaved?.();
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar endereço</DialogTitle>
            <DialogDescription>
              Faça login ou crie uma conta para salvar seus endereços e agilizar suas próximas compras.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Continuar sem salvar
            </Button>
            <Button asChild>
              <a href="/auth">Fazer login</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Salvar endereço
          </DialogTitle>
          <DialogDescription>
            Dê um nome para identificar este endereço facilmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Identificação</Label>
            <Select value={label} onValueChange={setLabel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {labelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {label === "Outro" && (
            <div className="space-y-2">
              <Label>Nome personalizado</Label>
              <Input
                placeholder="Ex: Casa da vó, Escritório..."
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
              />
            </div>
          )}

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Endereço a salvar:</p>
            <p className="text-muted-foreground">
              {addressData.address}, {addressData.number}
              {addressData.complement && ` - ${addressData.complement}`}
            </p>
            <p className="text-muted-foreground">
              {addressData.neighborhood}, {addressData.city} - {addressData.state}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || (label === "Outro" && !customLabel)}>
            {saving ? "Salvando..." : "Salvar endereço"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
