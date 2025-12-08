import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Plus, Trash2, Edit, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSavedAddresses, SavedAddress } from "@/hooks/useSavedAddresses";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import Footer from "@/components/landing/Footer";
import AddressAutocomplete from "@/components/checkout/AddressAutocomplete";

const Addresses = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, loading: addressesLoading } = useSavedAddresses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference: "",
    label: "",
    is_default: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
  }, [user, authLoading, navigate]);

  const resetForm = () => {
    setFormData({
      cep: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      reference: "",
      label: "",
      is_default: false,
    });
    setEditingAddress(null);
  };

  const handleOpenDialog = (address?: SavedAddress) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        cep: address.cep || "",
        address: address.address || "",
        number: address.number || "",
        complement: address.complement || "",
        neighborhood: address.neighborhood || "",
        city: address.city || "",
        state: address.state || "",
        reference: address.reference || "",
        label: address.label || "",
        is_default: address.is_default || false,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.address || !formData.number || !formData.neighborhood) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      if (editingAddress) {
        await updateAddress(editingAddress.id, {
          ...formData,
          is_default: formData.is_default,
        });
        toast.success("Endereço atualizado!");
      } else {
        await addAddress({
          ...formData,
          is_default: formData.is_default || addresses.length === 0,
        });
        toast.success("Endereço adicionado!");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar endereço");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;

    try {
      await deleteAddress(id);
      toast.success("Endereço excluído!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir endereço");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      toast.success("Endereço padrão atualizado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao definir endereço padrão");
    }
  };

  if (authLoading || addressesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader searchTerm="" onSearchChange={() => {}} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Meus Endereços</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie seus endereços de entrega
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Endereço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? "Editar Endereço" : "Novo Endereço"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Apelido (opcional)</Label>
                    <Input
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="Ex: Casa, Trabalho"
                    />
                  </div>

                  <AddressAutocomplete
                    value={formData}
                    onChange={(data) => setFormData({ ...formData, ...data })}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número *</Label>
                      <Input
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        placeholder="123"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Complemento</Label>
                      <Input
                        value={formData.complement}
                        onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                        placeholder="Apto, Bloco, etc"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ponto de Referência</Label>
                    <Input
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="Ex: Próximo ao mercado"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is_default" className="cursor-pointer">
                      Definir como endereço padrão
                    </Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {addresses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nenhum endereço cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione um endereço para facilitar suas entregas
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Endereço
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <Card key={address.id} className={address.is_default ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {address.label || "Endereço"}
                        {address.is_default && (
                          <Badge variant="default" className="text-xs">
                            Padrão
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {address.address}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      {address.neighborhood} - {address.city}/{address.state}
                    </p>
                    {address.cep && (
                      <p className="text-muted-foreground">CEP: {address.cep}</p>
                    )}
                    {address.reference && (
                      <p className="text-muted-foreground">
                        Referência: {address.reference}
                      </p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex gap-2">
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Padrão
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(address)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Addresses;

