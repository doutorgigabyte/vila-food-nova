import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Download, QrCode, Loader2, Utensils, Truck, Table2 } from "lucide-react";

interface QRCodeEntry {
  id: string;
  type: string;
  table_number: string | null;
  name: string | null;
  is_active: boolean | null;
}

const QRCodeManagement = () => {
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [qrcodes, setQrcodes] = useState<QRCodeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [establishmentSlug, setEstablishmentSlug] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "menu",
    table_number: "",
    name: "",
  });

  useEffect(() => {
    if (user && slug) fetchEstablishment();
  }, [user, slug]);

  useEffect(() => {
    if (establishmentId) fetchQRCodes();
  }, [establishmentId]);

  const fetchEstablishment = async () => {
    // First try to get establishment by slug from URL
    const { data } = await supabase
      .from("establishments")
      .select("id, slug")
      .eq("slug", slug)
      .maybeSingle();
    
    if (data) {
      setEstablishmentId(data.id);
      setEstablishmentSlug(data.slug);
    }
  };

  const fetchQRCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false });

    if (error) toast.error("Erro ao carregar QR Codes");
    else setQrcodes(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (form.type === "table" && !form.table_number) {
      toast.error("Número da mesa é obrigatório");
      return;
    }

    setSaving(true);
    const qrcodeData = {
      type: form.type,
      table_number: form.type === "table" ? form.table_number : null,
      name: form.name || null,
      establishment_id: establishmentId,
      is_active: true,
    };

    try {
      const { error } = await supabase.from("qr_codes").insert(qrcodeData);
      if (error) throw error;
      toast.success("QR Code criado!");
      setIsDialogOpen(false);
      setForm({ type: "menu", table_number: "", name: "" });
      fetchQRCodes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar QR Code");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qrcode: QRCodeEntry) => {
    if (!confirm("Deseja excluir este QR Code?")) return;
    const { error } = await supabase.from("qr_codes").delete().eq("id", qrcode.id);
    if (error) toast.error("Erro ao excluir QR Code");
    else {
      toast.success("QR Code excluído!");
      fetchQRCodes();
    }
  };

  const getQRCodeUrl = (qrcode: QRCodeEntry) => {
    const baseUrl = `${window.location.origin}/loja/${establishmentSlug}`;
    if (qrcode.type === "table" && qrcode.table_number) {
      return `${baseUrl}?mesa=${qrcode.table_number}`;
    }
    return baseUrl;
  };

  const generateQRCodeImage = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  };

  const handleDownload = async (qrcode: QRCodeEntry) => {
    const url = getQRCodeUrl(qrcode);
    const imageUrl = generateQRCodeImage(url);
    
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `qrcode-${qrcode.type}${qrcode.table_number ? `-mesa-${qrcode.table_number}` : ""}.png`;
    link.click();
    
    window.URL.revokeObjectURL(downloadUrl);
    toast.success("QR Code baixado!");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "menu": return <Utensils className="w-5 h-5" />;
      case "table": return <Table2 className="w-5 h-5" />;
      case "delivery": return <Truck className="w-5 h-5" />;
      default: return <QrCode className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "menu": return "Cardápio";
      case "table": return "Mesa";
      case "delivery": return "Delivery";
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={`/painel/${slug}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">QR Codes</h1>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo QR Code
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : qrcodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum QR Code cadastrado</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro QR Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {qrcodes.map((qrcode) => (
              <Card key={qrcode.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getTypeIcon(qrcode.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{getTypeLabel(qrcode.type)}</h3>
                      {qrcode.table_number && (
                        <p className="text-sm text-muted-foreground">Mesa {qrcode.table_number}</p>
                      )}
                      {qrcode.name && (
                        <p className="text-sm text-muted-foreground">{qrcode.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-center mb-4">
                    <img
                      src={generateQRCodeImage(getQRCodeUrl(qrcode))}
                      alt="QR Code"
                      className="w-40 h-40 rounded-lg border border-border"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(qrcode)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(qrcode)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm({ ...form, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menu">Cardápio Geral</SelectItem>
                  <SelectItem value="table">Mesa</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === "table" && (
              <div className="space-y-2">
                <Label htmlFor="table_number">Número da Mesa *</Label>
                <Input
                  id="table_number"
                  value={form.table_number}
                  onChange={(e) => setForm({ ...form, table_number: e.target.value })}
                  placeholder="1"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="QR Code Entrada"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRCodeManagement;
