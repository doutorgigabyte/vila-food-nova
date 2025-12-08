import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Boxes, Plus, Minus, AlertTriangle, Package, TrendingDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Product {
  id: string;
  name: string;
  stock_quantity: number | null;
  min_stock: number;
  cost_price: number | null;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  unit_cost: number | null;
  notes: string | null;
  created_at: string;
  products?: { name: string };
}

const movementTypes = [
  { value: "entry", label: "Entrada", color: "text-green-600" },
  { value: "exit", label: "Saída", color: "text-red-600" },
  { value: "adjustment", label: "Ajuste", color: "text-blue-600" },
  { value: "loss", label: "Perda", color: "text-orange-600" },
];

const InventoryManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    product_id: "",
    type: "entry",
    quantity: 1,
    unit_cost: "",
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

      const [productsRes, movementsRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, stock_quantity, min_stock, cost_price")
          .eq("establishment_id", establishment.id)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("inventory_movements")
          .select("*, products(name)")
          .eq("establishment_id", establishment.id)
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (movementsRes.data) setMovements(movementsRes.data as Movement[]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const createMovement = async () => {
    if (!establishmentId || !form.product_id || !form.quantity) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      const product = products.find(p => p.id === form.product_id);
      if (!product) return;

      // Calculate new stock
      const currentStock = product.stock_quantity || 0;
      let newStock = currentStock;
      
      if (form.type === "entry") {
        newStock = currentStock + form.quantity;
      } else {
        newStock = currentStock - form.quantity;
      }

      // Create movement
      await supabase.from("inventory_movements").insert({
        establishment_id: establishmentId,
        product_id: form.product_id,
        type: form.type,
        quantity: form.quantity,
        unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null,
        total_cost: form.unit_cost ? parseFloat(form.unit_cost) * form.quantity : null,
        notes: form.notes || null
      });

      // Update product stock
      await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", form.product_id);

      toast.success("Movimentação registrada!");
      setDialogOpen(false);
      setForm({ product_id: "", type: "entry", quantity: 1, unit_cost: "", notes: "" });
      fetchData();
    } catch (error) {
      toast.error("Erro ao registrar movimentação");
    }
  };

  const lowStockProducts = products.filter(p => 
    p.stock_quantity !== null && p.min_stock > 0 && p.stock_quantity <= p.min_stock
  );

  return (
    <DashboardLayout title="Gestão de Estoque">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos com Estoque</p>
                <p className="text-xl font-bold">
                  {products.filter(p => p.stock_quantity !== null).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-xl font-bold">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ArrowUpDown className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Movimentações</p>
                <p className="text-xl font-bold">{movements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Products Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Boxes className="w-5 h-5" />
              Estoque de Produtos
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Movimentação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Produto *</Label>
                    {products.length === 0 ? (
                      <div className="p-4 border rounded-lg bg-muted/50 text-center">
                        <p className="text-sm text-muted-foreground">
                          Nenhum produto cadastrado. Cadastre produtos primeiro.
                        </p>
                      </div>
                    ) : (
                      <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} {p.stock_quantity !== null && `(Estoque: ${p.stock_quantity})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label>Tipo *</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {movementTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                  </div>
                  {form.type === "entry" && (
                    <div>
                      <Label>Custo Unitário (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.unit_cost}
                        onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Motivo ou observação..."
                    />
                  </div>
                  <Button onClick={createMovement} className="w-full">
                    Registrar Movimentação
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.filter(p => p.stock_quantity !== null).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={
                          product.stock_quantity !== null && product.stock_quantity <= product.min_stock 
                            ? "destructive" 
                            : "outline"
                        }>
                          {product.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.min_stock}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Últimas Movimentações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {movements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma movimentação registrada
                </p>
              ) : (
                movements.map((mov) => {
                  const typeInfo = movementTypes.find(t => t.value === mov.type);
                  return (
                    <div key={mov.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{mov.products?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(mov.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={typeInfo?.color}>
                            {mov.type === "entry" ? "+" : "-"}{mov.quantity}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {typeInfo?.label}
                          </p>
                        </div>
                      </div>
                      {mov.notes && (
                        <p className="text-xs text-muted-foreground mt-2">{mov.notes}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="mt-6 border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Alerta de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map((p) => (
                <Badge key={p.id} variant="destructive">
                  {p.name}: {p.stock_quantity} unid.
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default InventoryManagement;
