import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Phone, Mail, Building, Pencil, Trash2, ShoppingCart, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  notes: string | null;
  is_active: boolean;
}

interface PurchaseItem {
  name: string;
  quantity: number;
  unit_price: number;
}

interface Purchase {
  id: string;
  supplier_id: string | null;
  invoice_number: string | null;
  items: PurchaseItem[];
  subtotal: number;
  taxes: number;
  shipping: number;
  total: number;
  payment_method: string | null;
  payment_status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  suppliers?: { name: string };
}

const SuppliersManagement = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  
  const [supplierForm, setSupplierForm] = useState({
    name: "", cnpj: "", phone: "", email: "", address: "", contact_person: "", notes: ""
  });
  
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: "",
    invoice_number: "",
    items: [{ name: "", quantity: 1, unit_price: 0 }] as PurchaseItem[],
    taxes: 0,
    shipping: 0,
    payment_method: "",
    payment_status: "pending",
    due_date: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: establishment } = await supabase
        .from("establishments")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!establishment) return;
      setEstablishmentId(establishment.id);

      const [suppliersRes, purchasesRes] = await Promise.all([
        supabase
          .from("suppliers")
          .select("*")
          .eq("establishment_id", establishment.id)
          .order("name"),
        supabase
          .from("supplier_purchases")
          .select("*, suppliers(name)")
          .eq("establishment_id", establishment.id)
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      if (suppliersRes.data) setSuppliers(suppliersRes.data);
      if (purchasesRes.data) {
        setPurchases(purchasesRes.data.map(p => ({
          ...p,
          items: (p.items as unknown as PurchaseItem[]) || []
        })));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSupplier = async () => {
    if (!establishmentId || !supplierForm.name) {
      toast.error("Preencha o nome do fornecedor");
      return;
    }

    try {
      const payload = {
        establishment_id: establishmentId,
        name: supplierForm.name,
        cnpj: supplierForm.cnpj || null,
        phone: supplierForm.phone || null,
        email: supplierForm.email || null,
        address: supplierForm.address || null,
        contact_person: supplierForm.contact_person || null,
        notes: supplierForm.notes || null
      };

      if (editingSupplier) {
        await supabase.from("suppliers").update(payload).eq("id", editingSupplier.id);
        toast.success("Fornecedor atualizado!");
      } else {
        await supabase.from("suppliers").insert(payload);
        toast.success("Fornecedor cadastrado!");
      }

      setSupplierDialogOpen(false);
      resetSupplierForm();
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar");
    }
  };

  const savePurchase = async () => {
    if (!establishmentId) return;

    const validItems = purchaseForm.items.filter(i => i.name && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    try {
      const subtotal = validItems.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0);
      const total = subtotal + purchaseForm.taxes + purchaseForm.shipping;

      await supabase.from("supplier_purchases").insert({
        establishment_id: establishmentId,
        supplier_id: purchaseForm.supplier_id || null,
        invoice_number: purchaseForm.invoice_number || null,
        items: validItems as unknown as any,
        subtotal,
        taxes: purchaseForm.taxes,
        shipping: purchaseForm.shipping,
        total,
        payment_method: purchaseForm.payment_method || null,
        payment_status: purchaseForm.payment_status,
        due_date: purchaseForm.due_date || null,
        notes: purchaseForm.notes || null
      });

      toast.success("Compra registrada!");
      setPurchaseDialogOpen(false);
      resetPurchaseForm();
      fetchData();
    } catch (error) {
      toast.error("Erro ao registrar");
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm("Deseja excluir este fornecedor?")) return;
    try {
      await supabase.from("suppliers").delete().eq("id", id);
      toast.success("Fornecedor excluído!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm({ name: "", cnpj: "", phone: "", email: "", address: "", contact_person: "", notes: "" });
    setEditingSupplier(null);
  };

  const resetPurchaseForm = () => {
    setPurchaseForm({
      supplier_id: "",
      invoice_number: "",
      items: [{ name: "", quantity: 1, unit_price: 0 }],
      taxes: 0,
      shipping: 0,
      payment_method: "",
      payment_status: "pending",
      due_date: "",
      notes: ""
    });
  };

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      cnpj: supplier.cnpj || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      contact_person: supplier.contact_person || "",
      notes: supplier.notes || ""
    });
    setSupplierDialogOpen(true);
  };

  const addPurchaseItem = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, { name: "", quantity: 1, unit_price: 0 }]
    });
  };

  const updatePurchaseItem = (index: number, field: string, value: any) => {
    const newItems = [...purchaseForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setPurchaseForm({ ...purchaseForm, items: newItems });
  };

  const totalPurchases = purchases.reduce((acc, p) => acc + p.total, 0);
  const pendingPurchases = purchases.filter(p => p.payment_status === "pending");

  return (
    <DashboardLayout title="Fornecedores">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fornecedores</p>
                <p className="text-xl font-bold">{suppliers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total em Compras</p>
                <p className="text-xl font-bold">R$ {totalPurchases.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">A Pagar</p>
                <p className="text-xl font-bold">
                  R$ {pendingPurchases.reduce((acc, p) => acc + p.total, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suppliers" className="mt-6">
        <TabsList>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Fornecedores
              </CardTitle>
              <Dialog open={supplierDialogOpen} onOpenChange={(open) => { setSupplierDialogOpen(open); if (!open) resetSupplierForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" /> Novo</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingSupplier ? "Editar" : "Novo"} Fornecedor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <Label>Nome *</Label>
                      <Input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <Input value={supplierForm.cnpj} onChange={(e) => setSupplierForm({ ...supplierForm, cnpj: e.target.value })} />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Endereço</Label>
                      <Input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
                    </div>
                    <div>
                      <Label>Contato</Label>
                      <Input value={supplierForm.contact_person} onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })} />
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Textarea value={supplierForm.notes} onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })} />
                    </div>
                    <Button onClick={saveSupplier} className="w-full">{editingSupplier ? "Salvar" : "Cadastrar"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {suppliers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum fornecedor cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {supplier.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {supplier.phone}</p>}
                            {supplier.email && <p className="flex items-center gap-1 text-muted-foreground"><Mail className="w-3 h-3" /> {supplier.email}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{supplier.cnpj || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => openEditSupplier(supplier)}><Pencil className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteSupplier(supplier.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Compras
              </CardTitle>
              <Dialog open={purchaseDialogOpen} onOpenChange={(open) => { setPurchaseDialogOpen(open); if (!open) resetPurchaseForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" /> Nova Compra</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Nova Compra</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <Label>Fornecedor</Label>
                      <Select value={purchaseForm.supplier_id} onValueChange={(v) => setPurchaseForm({ ...purchaseForm, supplier_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nota Fiscal</Label>
                      <Input value={purchaseForm.invoice_number} onChange={(e) => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })} />
                    </div>
                    <div>
                      <Label>Itens</Label>
                      {purchaseForm.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 mt-2">
                          <Input placeholder="Produto" value={item.name} onChange={(e) => updatePurchaseItem(idx, "name", e.target.value)} className="flex-1" />
                          <Input type="number" placeholder="Qtd" value={item.quantity} onChange={(e) => updatePurchaseItem(idx, "quantity", parseInt(e.target.value) || 0)} className="w-16" />
                          <Input type="number" placeholder="R$" value={item.unit_price} onChange={(e) => updatePurchaseItem(idx, "unit_price", parseFloat(e.target.value) || 0)} className="w-20" />
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addPurchaseItem} className="mt-2">
                        <Plus className="w-3 h-3 mr-1" /> Item
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Impostos</Label>
                        <Input type="number" value={purchaseForm.taxes} onChange={(e) => setPurchaseForm({ ...purchaseForm, taxes: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label>Frete</Label>
                        <Input type="number" value={purchaseForm.shipping} onChange={(e) => setPurchaseForm({ ...purchaseForm, shipping: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <div>
                      <Label>Status Pagamento</Label>
                      <Select value={purchaseForm.payment_status} onValueChange={(v) => setPurchaseForm({ ...purchaseForm, payment_status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="partial">Parcial</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Vencimento</Label>
                      <Input type="date" value={purchaseForm.due_date} onChange={(e) => setPurchaseForm({ ...purchaseForm, due_date: e.target.value })} />
                    </div>
                    <Button onClick={savePurchase} className="w-full">Registrar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma compra registrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>NF</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{format(new Date(purchase.created_at), "dd/MM/yy", { locale: ptBR })}</TableCell>
                        <TableCell>{purchase.suppliers?.name || "-"}</TableCell>
                        <TableCell>{purchase.invoice_number || "-"}</TableCell>
                        <TableCell className="text-right font-bold">R$ {purchase.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={purchase.payment_status === "paid" ? "default" : purchase.payment_status === "partial" ? "secondary" : "outline"}>
                            {purchase.payment_status === "paid" ? "Pago" : purchase.payment_status === "partial" ? "Parcial" : "Pendente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SuppliersManagement;
