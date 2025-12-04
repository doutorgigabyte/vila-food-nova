import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, ClipboardList, Users, DollarSign, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface TabItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Tab {
  id: string;
  table_number: string;
  waiter_name: string;
  customer_name: string;
  status: string;
  items: TabItem[];
  subtotal: number;
  discount: number;
  total: number;
  opened_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

const WaiterApp = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTabDialog, setNewTabDialog] = useState(false);
  const [newTab, setNewTab] = useState({ table_number: "", waiter_name: "", customer_name: "" });

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

      const [tabsRes, productsRes] = await Promise.all([
        supabase
          .from("waiter_tabs")
          .select("*")
          .eq("establishment_id", establishment.id)
          .eq("status", "open")
          .order("opened_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, name, price, image_url")
          .eq("establishment_id", establishment.id)
          .eq("is_active", true)
      ]);

      if (tabsRes.data) {
        setTabs(tabsRes.data.map(t => ({
          ...t,
          items: (t.items as unknown as TabItem[]) || []
        })));
      }
      if (productsRes.data) setProducts(productsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTab = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: establishment } = await supabase
        .from("establishments")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!establishment) return;

      const { data, error } = await supabase
        .from("waiter_tabs")
        .insert({
          establishment_id: establishment.id,
          ...newTab,
          items: [],
          subtotal: 0,
          total: 0
        })
        .select()
        .single();

      if (error) throw error;

      setTabs([{ ...data, items: [] }, ...tabs]);
      setNewTabDialog(false);
      setNewTab({ table_number: "", waiter_name: "", customer_name: "" });
      toast.success("Comanda aberta!");
    } catch (error) {
      toast.error("Erro ao criar comanda");
    }
  };

  const addToTab = async (product: Product) => {
    if (!selectedTab) return;

    const existingItem = selectedTab.items.find(i => i.product_id === product.id);
    let newItems: TabItem[];

    if (existingItem) {
      newItems = selectedTab.items.map(i =>
        i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...selectedTab.items, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        price: product.price
      }];
    }

    const subtotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const total = subtotal - (selectedTab.discount || 0);

    const { error } = await supabase
      .from("waiter_tabs")
      .update({ items: newItems as unknown as any, subtotal, total })
      .eq("id", selectedTab.id);

    if (!error) {
      const updatedTab = { ...selectedTab, items: newItems, subtotal, total };
      setSelectedTab(updatedTab);
      setTabs(tabs.map(t => t.id === selectedTab.id ? updatedTab : t));
    }
  };

  const updateQuantity = async (productId: string, delta: number) => {
    if (!selectedTab) return;

    let newItems = selectedTab.items.map(i => {
      if (i.product_id === productId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : null;
      }
      return i;
    }).filter(Boolean) as TabItem[];

    const subtotal = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const total = subtotal - (selectedTab.discount || 0);

    const { error } = await supabase
      .from("waiter_tabs")
      .update({ items: newItems as unknown as any, subtotal, total })
      .eq("id", selectedTab.id);

    if (!error) {
      const updatedTab = { ...selectedTab, items: newItems, subtotal, total };
      setSelectedTab(updatedTab);
      setTabs(tabs.map(t => t.id === selectedTab.id ? updatedTab : t));
    }
  };

  const closeTab = async () => {
    if (!selectedTab) return;

    const { error } = await supabase
      .from("waiter_tabs")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", selectedTab.id);

    if (!error) {
      setTabs(tabs.filter(t => t.id !== selectedTab.id));
      setSelectedTab(null);
      toast.success("Comanda fechada!");
    }
  };

  return (
    <DashboardLayout title="Comanda Digital">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Comandas Abertas */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Comandas Abertas
            </CardTitle>
            <Dialog open={newTabDialog} onOpenChange={setNewTabDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Nova
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Comanda</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Mesa</Label>
                    <Input 
                      value={newTab.table_number}
                      onChange={(e) => setNewTab({ ...newTab, table_number: e.target.value })}
                      placeholder="Ex: Mesa 5"
                    />
                  </div>
                  <div>
                    <Label>Garçom</Label>
                    <Input 
                      value={newTab.waiter_name}
                      onChange={(e) => setNewTab({ ...newTab, waiter_name: e.target.value })}
                      placeholder="Nome do garçom"
                    />
                  </div>
                  <div>
                    <Label>Cliente (opcional)</Label>
                    <Input 
                      value={newTab.customer_name}
                      onChange={(e) => setNewTab({ ...newTab, customer_name: e.target.value })}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <Button onClick={createTab} className="w-full">Abrir Comanda</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : tabs.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma comanda aberta</p>
            ) : (
              tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setSelectedTab(tab)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTab?.id === tab.id
                      ? "bg-primary/10 border border-primary"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{tab.table_number}</span>
                    <Badge variant="outline">
                      {tab.items.length} itens
                    </Badge>
                  </div>
                  {tab.waiter_name && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <Users className="w-3 h-3 inline mr-1" />
                      {tab.waiter_name}
                    </p>
                  )}
                  <p className="text-sm font-medium mt-1">
                    R$ {(tab.total || 0).toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => selectedTab && addToTab(product)}
                  disabled={!selectedTab}
                  className="p-3 bg-muted/50 hover:bg-muted rounded-lg text-left transition-colors disabled:opacity-50"
                >
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-primary text-sm font-bold">
                    R$ {product.price.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comanda Selecionada */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {selectedTab ? selectedTab.table_number : "Selecione uma comanda"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTab ? (
              <div className="space-y-4">
                <div className="max-h-[40vh] overflow-y-auto space-y-2">
                  {selectedTab.items.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product_id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product_id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ {(selectedTab.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {selectedTab.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto</span>
                      <span>-R$ {selectedTab.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {(selectedTab.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                <Button onClick={closeTab} className="w-full" variant="default">
                  <Check className="w-4 h-4 mr-2" />
                  Fechar Comanda
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Selecione uma comanda para visualizar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WaiterApp;
