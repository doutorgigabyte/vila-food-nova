import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, Minus, ClipboardList, Users, DollarSign, Trash2, Check, 
  Search, Clock, CreditCard, QrCode, Banknote, Receipt, 
  ChefHat, Grid3X3, LayoutGrid, X, Printer, Split, Send, History
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface TabItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  notes?: string;
  sent_to_kitchen?: boolean;
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
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

// Configuração de mesas - pode ser personalizado pelo estabelecimento
const TABLE_CONFIG = {
  rows: 4,
  cols: 5,
  tables: Array.from({ length: 20 }, (_, i) => ({
    number: (i + 1).toString(),
    label: `Mesa ${i + 1}`
  }))
};

const WaiterApp = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTabDialog, setNewTabDialog] = useState(false);
  const [closeTabDialog, setCloseTabDialog] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newTab, setNewTab] = useState({ table_number: "", waiter_name: "", customer_name: "" });
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [splitCount, setSplitCount] = useState(1);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [historyDialog, setHistoryDialog] = useState(false);
  const [tabHistory, setTabHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Helper to log tab history
  const logTabHistory = async (tabId: string, action: string, details: any = {}) => {
    if (!establishmentId) return;
    try {
      await supabase.from("waiter_tab_history").insert({
        tab_id: tabId,
        establishment_id: establishmentId,
        action,
        details,
        user_name: userName
      });
    } catch (error) {
      console.error("Error logging tab history:", error);
    }
  };

  // Fetch tab history
  const fetchTabHistory = async (tabId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("waiter_tab_history")
        .select("*")
        .eq("tab_id", tabId)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setTabHistory(data);
      }
    } catch (error) {
      console.error("Error fetching tab history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Garçom";
        setUserName(name);
        // Pre-fill waiter name with user name
        setNewTab(prev => ({ ...prev, waiter_name: name }));
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error getting user:", userError);
        toast.error("Erro ao obter dados do usuário");
        return;
      }

      const { data: establishment, error: estError } = await supabase
        .from("establishments")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (estError || !establishment) {
        console.error("Error getting establishment:", estError);
        toast.error("Estabelecimento não encontrado");
        return;
      }
      
      setEstablishmentId(establishment.id);

      const [tabsRes, productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("waiter_tabs")
          .select("*")
          .eq("establishment_id", establishment.id)
          .eq("status", "open")
          .order("opened_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, name, price, image_url, category_id")
          .eq("establishment_id", establishment.id)
          .eq("is_active", true),
        supabase
          .from("categories")
          .select("id, name")
          .eq("establishment_id", establishment.id)
          .eq("is_active", true)
          .order("sort_order")
      ]);

      if (tabsRes.data) {
        setTabs(tabsRes.data.map(t => ({
          ...t,
          items: Array.isArray(t.items) ? (t.items as unknown as TabItem[]) : []
        } as Tab)));
      }
      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTableStatus = (tableNumber: string) => {
    const tab = tabs.find(t => t.table_number === tableNumber || t.table_number === `Mesa ${tableNumber}`);
    if (!tab) return "free";
    if (tab.items.some(i => !i.sent_to_kitchen)) return "pending";
    return "occupied";
  };

  const getTableTab = (tableNumber: string) => {
    return tabs.find(t => t.table_number === tableNumber || t.table_number === `Mesa ${tableNumber}`);
  };

  const selectTable = (tableNumber: string) => {
    const existingTab = getTableTab(tableNumber);
    if (existingTab) {
      setSelectedTab(existingTab);
    } else {
      setNewTab({ table_number: `Mesa ${tableNumber}`, waiter_name: userName, customer_name: "" });
      setNewTabDialog(true);
    }
  };

  const createTab = async () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }

    // Validate required fields
    if (!newTab.table_number || !newTab.table_number.trim()) {
      toast.error("Informe o número da mesa");
      return;
    }

    if (!newTab.waiter_name || !newTab.waiter_name.trim()) {
      toast.error("Informe o nome do garçom");
      return;
    }

    try {
      const tabData = {
        establishment_id: establishmentId,
        table_number: newTab.table_number.trim(),
        waiter_name: newTab.waiter_name.trim(),
        customer_name: newTab.customer_name?.trim() || null,
        items: [],
        subtotal: 0,
        total: 0,
        status: 'open'
      };

      const { data, error } = await supabase
        .from("waiter_tabs")
        .insert(tabData)
        .select()
        .single();

      if (error) {
        console.error("Error creating tab:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Nenhum dado retornado ao criar comanda");
      }

      const newTabData: Tab = { 
        ...data, 
        items: Array.isArray(data.items) ? (data.items as unknown as TabItem[]) : [],
        notes: data.notes || undefined
      };
      setTabs([newTabData, ...tabs]);
      setSelectedTab(newTabData);
      setNewTabDialog(false);
      // Reset form but keep waiter name
      setNewTab({ table_number: "", waiter_name: userName || "", customer_name: "" });
      toast.success("Comanda aberta com sucesso!");
      
      // Refresh data to ensure consistency
      await fetchData();
    } catch (error: any) {
      console.error("Error creating tab:", error);
      const errorMessage = error?.message || "Erro ao criar comanda";
      toast.error(errorMessage);
    }
  };

  const addToTab = async (product: Product) => {
    if (!selectedTab) {
      toast.error("Selecione uma mesa primeiro");
      return;
    }

    const existingItem = selectedTab.items.find(i => i.product_id === product.id && !i.sent_to_kitchen);
    let newItems: TabItem[];

    if (existingItem) {
      newItems = selectedTab.items.map(i =>
        i.product_id === product.id && !i.sent_to_kitchen ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...selectedTab.items, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        price: product.price,
        sent_to_kitchen: false
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
      toast.success(`${product.name} adicionado`);
      
      // Log history
      logTabHistory(selectedTab.id, existingItem ? 'item_updated' : 'item_added', {
        product_name: product.name,
        quantity: existingItem ? existingItem.quantity + 1 : 1,
        price: product.price
      });
    }
  };

  const updateQuantity = async (productId: string, delta: number, sentToKitchen: boolean = false) => {
    if (!selectedTab) return;

    let newItems = selectedTab.items.map(i => {
      if (i.product_id === productId && i.sent_to_kitchen === sentToKitchen) {
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
      
      // Log history for quantity change
      const item = selectedTab.items.find(i => i.product_id === productId && i.sent_to_kitchen === sentToKitchen);
      if (item) {
        const action = delta > 0 ? 'item_updated' : (item.quantity + delta <= 0 ? 'item_removed' : 'item_updated');
        logTabHistory(selectedTab.id, action, {
          product_name: item.product_name,
          quantity_change: delta,
          new_quantity: Math.max(0, item.quantity + delta)
        });
      }
    }
  };

  const sendToKitchen = async () => {
    if (!selectedTab || !establishmentId) return;

    const itemsToSend = selectedTab.items.filter(i => !i.sent_to_kitchen);
    if (itemsToSend.length === 0) {
      toast.warning("Nenhum item novo para enviar");
      return;
    }

    try {
      // 1. Criar pedido na tabela orders com status 'preparing'
      const orderItems = itemsToSend.map(i => ({
        product_id: i.product_id,
        name: i.product_name,
        quantity: i.quantity,
        price: i.price,
        notes: i.notes || null
      }));

      const subtotal = itemsToSend.reduce((acc, i) => acc + (i.price * i.quantity), 0);

      const { data: orderResult, error: orderError } = await supabase.rpc('create_order', {
        p_establishment_id: establishmentId,
        p_delivery_type: 'table',
        p_payment_method: 'pending',
        p_items: orderItems,
        p_subtotal: subtotal,
        p_total: subtotal,
        p_table_number: selectedTab.table_number,
        p_order_source: 'comanda'
      });

      const result = orderResult as { success: boolean; id?: string; order_number?: number; error?: string } | null;
      
      if (orderError || !result?.success) {
        console.error("Erro ao criar pedido:", orderError || result?.error);
        toast.error("Erro ao criar pedido para cozinha");
        return;
      }

      // Atualizar status para 'preparing' (RPC cria com 'pending')
      const { error: statusError } = await supabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', result.id!);

      if (statusError) {
        console.error("Erro ao atualizar status:", statusError);
      }

      const order = { id: result.id!, order_number: result.order_number! };

      // 2. Marcar itens como enviados na comanda
      const newItems = selectedTab.items.map(i => ({
        ...i,
        sent_to_kitchen: true,
        order_id: order.id
      }));

      const { error: updateError } = await supabase
        .from("waiter_tabs")
        .update({ items: newItems as unknown as any })
        .eq("id", selectedTab.id);

      if (updateError) {
        console.error("Erro ao atualizar comanda:", updateError);
      }

      // 3. Criar notificação para cozinha
      await supabase.from('notifications').insert({
        establishment_id: establishmentId,
        type: 'new_order',
        priority: 'critical',
        title: `Pedido #${order.order_number} - ${selectedTab.table_number}`,
        message: `${itemsToSend.length} ${itemsToSend.length === 1 ? 'item' : 'itens'} para preparo`,
        target_roles: ['manager', 'kitchen'],
        data: { order_id: order.id, table_number: selectedTab.table_number }
      });

      const updatedTab = { ...selectedTab, items: newItems };
      setSelectedTab(updatedTab);
      setTabs(tabs.map(t => t.id === selectedTab.id ? updatedTab : t));
      toast.success(`Pedido #${order.order_number} enviado para a cozinha!`);
      
      // Log history
      logTabHistory(selectedTab.id, 'sent_to_kitchen', {
        order_id: order.id,
        order_number: order.order_number,
        items_count: itemsToSend.length,
        items: itemsToSend.map(i => ({ name: i.product_name, quantity: i.quantity }))
      });
    } catch (error) {
      console.error("Erro ao enviar para cozinha:", error);
      toast.error("Erro ao enviar pedido para cozinha");
    }
  };

  const closeTab = async () => {
    if (!selectedTab) return;

    const { error } = await supabase
      .from("waiter_tabs")
      .update({ 
        status: "closed", 
        closed_at: new Date().toISOString(),
        notes: `Pagamento: ${paymentMethod}${splitCount > 1 ? ` (dividido em ${splitCount})` : ''}`
      })
      .eq("id", selectedTab.id);

    if (!error) {
      // Log history before clearing selection
      logTabHistory(selectedTab.id, 'tab_closed', {
        payment_method: paymentMethod,
        split_count: splitCount,
        total: selectedTab.total
      });
      
      setTabs(tabs.filter(t => t.id !== selectedTab.id));
      setSelectedTab(null);
      setCloseTabDialog(false);
      setSplitCount(1);
      setPaymentMethod("cash");
      toast.success("Comanda fechada com sucesso!");
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, selectedCategory]);

  const pendingItems = selectedTab?.items.filter(i => !i.sent_to_kitchen) || [];
  const sentItems = selectedTab?.items.filter(i => i.sent_to_kitchen) || [];

  const getElapsedTime = (openedAt: string) => {
    const diff = Date.now() - new Date(openedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}min`;
    return `${minutes}min`;
  };

  return (
    <DashboardLayout title="Comanda Digital">
      <div className="grid lg:grid-cols-12 gap-4 h-[calc(100vh-180px)]">
        {/* Grid de Mesas */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              Mesas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="grid grid-cols-4 gap-2">
              {TABLE_CONFIG.tables.map((table) => {
                const status = getTableStatus(table.number);
                const tab = getTableTab(table.number);
                return (
                  <button
                    key={table.number}
                    onClick={() => selectTable(table.number)}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all
                      ${selectedTab?.table_number === `Mesa ${table.number}` ? "ring-2 ring-primary ring-offset-2" : ""}
                      ${status === "free" 
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" 
                        : status === "pending"
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 animate-pulse"
                        : "bg-primary/20 text-primary hover:bg-primary/30"}
                    `}
                  >
                    <span className="text-lg font-bold">{table.number}</span>
                    {tab && (
                      <span className="text-[10px] opacity-75">
                        R${tab.total.toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Legenda */}
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Livre</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Ocupada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Cardápio</CardTitle>
              {selectedTab && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {getElapsedTime(selectedTab.opened_at)}
                </Badge>
              )}
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col">
            {/* Categorias */}
            <ScrollArea className="w-full whitespace-nowrap mb-3">
              <div className="flex gap-2 pb-2">
                <Button
                  size="sm"
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  className="shrink-0"
                >
                  Todos
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="shrink-0"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Grid de Produtos */}
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToTab(product)}
                    disabled={!selectedTab}
                    className="p-3 bg-muted/50 hover:bg-muted rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {product.image_url && (
                      <div className="aspect-video bg-muted rounded mb-2 overflow-hidden">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-primary text-sm font-bold">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Comanda Selecionada */}
        <Card className="lg:col-span-4 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                {selectedTab ? selectedTab.table_number : "Selecione uma mesa"}
              </CardTitle>
              {selectedTab && (
                <Button size="icon" variant="ghost" onClick={() => setSelectedTab(null)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {selectedTab?.waiter_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {selectedTab.waiter_name}
                {selectedTab.customer_name && ` • ${selectedTab.customer_name}`}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden flex flex-col">
            {selectedTab ? (
              <>
                <ScrollArea className="flex-1 -mx-4 px-4">
                  {/* Itens pendentes (não enviados) */}
                  {pendingItems.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Aguardando envio ({pendingItems.length})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {pendingItems.map((item, idx) => (
                          <div key={`pending-${item.product_id}-${idx}`} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                R$ {item.price.toFixed(2)} × {item.quantity} = R$ {(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.product_id, -1, false)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.product_id, 1, false)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button 
                        onClick={sendToKitchen} 
                        className="w-full mt-3"
                        variant="secondary"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar para Cozinha
                      </Button>
                    </div>
                  )}

                  {/* Itens já enviados */}
                  {sentItems.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase mb-2 flex items-center gap-1">
                        <ChefHat className="w-3 h-3" />
                        Enviado para cozinha ({sentItems.length})
                      </h4>
                      <div className="space-y-2">
                        {sentItems.map((item, idx) => (
                          <div key={`sent-${item.product_id}-${idx}`} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                R$ {item.price.toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                            <span className="text-sm font-bold">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTab.items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Comanda vazia</p>
                      <p className="text-xs">Adicione produtos do cardápio</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Totais e Ações */}
                <div className="border-t pt-4 mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
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
                    <span className="text-primary">R$ {(selectedTab.total || 0).toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4 mr-1" />
                      Imprimir
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        fetchTabHistory(selectedTab.id);
                        setHistoryDialog(true);
                      }}
                    >
                      <History className="w-4 h-4 mr-1" />
                      Histórico
                    </Button>
                    <Dialog open={closeTabDialog} onOpenChange={setCloseTabDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" disabled={selectedTab.items.length === 0}>
                          <DollarSign className="w-4 h-4 mr-1" />
                          Fechar Conta
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Fechar Conta - {selectedTab.table_number}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total</span>
                              <span className="text-primary">R$ {(selectedTab.total || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Forma de Pagamento</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <Button
                                type="button"
                                variant={paymentMethod === "cash" ? "default" : "outline"}
                                onClick={() => setPaymentMethod("cash")}
                                className="justify-start"
                              >
                                <Banknote className="w-4 h-4 mr-2" />
                                Dinheiro
                              </Button>
                              <Button
                                type="button"
                                variant={paymentMethod === "pix" ? "default" : "outline"}
                                onClick={() => setPaymentMethod("pix")}
                                className="justify-start"
                              >
                                <QrCode className="w-4 h-4 mr-2" />
                                PIX
                              </Button>
                              <Button
                                type="button"
                                variant={paymentMethod === "credit" ? "default" : "outline"}
                                onClick={() => setPaymentMethod("credit")}
                                className="justify-start"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Crédito
                              </Button>
                              <Button
                                type="button"
                                variant={paymentMethod === "debit" ? "default" : "outline"}
                                onClick={() => setPaymentMethod("debit")}
                                className="justify-start"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Débito
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Dividir Conta</Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <div className="flex-1 text-center">
                                <span className="text-2xl font-bold">{splitCount}</span>
                                <p className="text-xs text-muted-foreground">
                                  {splitCount === 1 ? "Sem divisão" : `R$ ${(selectedTab.total / splitCount).toFixed(2)} por pessoa`}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setSplitCount(splitCount + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <Separator />

                          <Button onClick={closeTab} className="w-full" size="lg">
                            <Check className="w-4 h-4 mr-2" />
                            Confirmar Pagamento
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <LayoutGrid className="w-16 h-16 mb-4 opacity-30" />
                <p className="font-medium">Nenhuma mesa selecionada</p>
                <p className="text-sm">Clique em uma mesa para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nova Comanda */}
      <Dialog open={newTabDialog} onOpenChange={setNewTabDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Abrir Nova Comanda
            </DialogTitle>
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
              <Label>Nome do Garçom</Label>
              <Input 
                value={newTab.waiter_name}
                onChange={(e) => setNewTab({ ...newTab, waiter_name: e.target.value })}
                placeholder="Seu nome"
              />
            </div>
            <div>
              <Label>Nome do Cliente (opcional)</Label>
              <Input 
                value={newTab.customer_name}
                onChange={(e) => setNewTab({ ...newTab, customer_name: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
            <Button onClick={createTab} className="w-full" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Abrir Comanda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Alterações
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            {loadingHistory ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando histórico...
              </div>
            ) : tabHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma alteração registrada
              </div>
            ) : (
              <div className="space-y-3">
                {tabHistory.map((entry) => (
                  <div key={entry.id} className="p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={
                        entry.action === 'item_added' ? 'default' :
                        entry.action === 'item_removed' ? 'destructive' :
                        entry.action === 'sent_to_kitchen' ? 'secondary' :
                        entry.action === 'tab_closed' ? 'outline' : 'secondary'
                      }>
                        {entry.action === 'item_added' && 'Item Adicionado'}
                        {entry.action === 'item_removed' && 'Item Removido'}
                        {entry.action === 'item_updated' && 'Item Atualizado'}
                        {entry.action === 'sent_to_kitchen' && 'Enviado à Cozinha'}
                        {entry.action === 'tab_closed' && 'Comanda Fechada'}
                        {entry.action === 'discount_applied' && 'Desconto Aplicado'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm">
                      {entry.details?.product_name && (
                        <span className="font-medium">{entry.details.product_name}</span>
                      )}
                      {entry.details?.quantity && (
                        <span> × {entry.details.quantity}</span>
                      )}
                      {entry.details?.items_count && (
                        <span>{entry.details.items_count} itens</span>
                      )}
                      {entry.details?.payment_method && (
                        <span>Pagamento: {entry.details.payment_method}</span>
                      )}
                    </p>
                    {entry.user_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Por: {entry.user_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default WaiterApp;
