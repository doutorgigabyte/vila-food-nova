import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ShoppingCart, MessageSquare, Phone, DollarSign, TrendingUp, Check, RefreshCw, Send, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

interface AbandonedCart {
  id: string;
  masked_phone: string;
  customer_name: string | null;
  items: CartItem[];
  total: number;
  recovery_attempts: number;
  last_recovery_at: string | null;
  recovered: boolean;
  created_at: string;
  updated_at: string;
}

const AbandonedCartsManagement = () => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [autoRecoveryEnabled, setAutoRecoveryEnabled] = useState(false);
  const [recoveryInterval, setRecoveryInterval] = useState("30");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: establishment } = await supabase
        .from("establishments")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!establishment) return;

      // Use RPC to get masked data
      const { data } = await supabase
        .rpc("get_establishment_abandoned_carts", { p_establishment_id: establishment.id });

      if (data) {
        setCarts(data.map((c: any) => ({
          ...c,
          items: (c.items as unknown as CartItem[]) || []
        })));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendRecoveryMessage = async (cart: AbandonedCart) => {
    setSending(cart.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: establishment } = await supabase
        .from("establishments")
        .select("id, name, slug")
        .eq("owner_id", user.id)
        .single();

      if (!establishment) return;

      // Get full phone number from database for sending (this is allowed via RLS for establishment owner)
      const { data: cartData } = await supabase
        .from("abandoned_carts")
        .select("customer_phone")
        .eq("id", cart.id)
        .single();

      if (!cartData?.customer_phone) {
        toast.error("Telefone não encontrado");
        return;
      }

      // Call WhatsApp notification function
      const itemsList = cart.items.map(i => `${i.quantity}x ${i.name}`).join("\n");
      const message = `Olá ${cart.customer_name || ""}! 👋\n\nVimos que você deixou alguns itens no carrinho:\n\n${itemsList}\n\nTotal: R$ ${cart.total.toFixed(2)}\n\nQue tal finalizar seu pedido? Estamos com tudo preparado para você! 🛒\n\nAcesse: ${window.location.origin}/loja/${establishment.slug}`;

      const { error } = await supabase.functions.invoke("whatsapp-notification", {
        body: {
          phone: cartData.customer_phone,
          message,
          establishment_id: establishment.id
        }
      });

      if (error) throw error;

      // Update recovery attempts
      await supabase
        .from("abandoned_carts")
        .update({
          recovery_attempts: cart.recovery_attempts + 1,
          last_recovery_at: new Date().toISOString()
        })
        .eq("id", cart.id);

      toast.success("Mensagem de recuperação enviada!");
      fetchCarts();
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(null);
    }
  };

  const markAsRecovered = async (cartId: string) => {
    try {
      await supabase
        .from("abandoned_carts")
        .update({ recovered: true })
        .eq("id", cartId);

      toast.success("Carrinho marcado como recuperado!");
      fetchCarts();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const totalValue = carts.reduce((acc, c) => acc + c.total, 0);
  const recentCarts = carts.filter(c => {
    const hoursDiff = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  });

  return (
    <DashboardLayout title="Recuperador de Vendas">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carrinhos Abandonados</p>
                <p className="text-xl font-bold">{carts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total Perdido</p>
                <p className="text-xl font-bold">R$ {totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Últimas 24h</p>
                <p className="text-xl font-bold">{recentCarts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto Recovery Config */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="w-4 h-4" />
            Recuperacao Automatica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={autoRecoveryEnabled}
                onCheckedChange={setAutoRecoveryEnabled}
              />
              <Label className="text-sm">Enviar WhatsApp automaticamente</Label>
            </div>
            {autoRecoveryEnabled && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Apos</Label>
                  <Select value={recoveryInterval} onValueChange={setRecoveryInterval}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 min</SelectItem>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Max tentativas</Label>
                  <Select value={maxAttempts} onValueChange={setMaxAttempts}>
                    <SelectTrigger className="w-16 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          {autoRecoveryEnabled && (
            <p className="text-xs text-muted-foreground mt-2">
              Mensagens serao enviadas automaticamente {recoveryInterval} min apos o abandono, ate {maxAttempts} tentativas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrinhos Abandonados
            </CardTitle>
            {carts.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                disabled={sendingAll}
                onClick={async () => {
                  setSendingAll(true);
                  const eligible = carts.filter(c => c.recovery_attempts < parseInt(maxAttempts));
                  for (const cart of eligible) {
                    await sendRecoveryMessage(cart);
                  }
                  setSendingAll(false);
                  toast.success(`${eligible.length} mensagens enviadas!`);
                }}
              >
                <Send className="w-4 h-4 mr-1" />
                {sendingAll ? "Enviando..." : `Enviar para todos (${carts.filter(c => c.recovery_attempts < parseInt(maxAttempts)).length})`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : carts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum carrinho abandonado 🎉
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carts.map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cart.customer_name || "Cliente"}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {cart.masked_phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {cart.items.slice(0, 2).map((item, i) => (
                          <span key={i} className="block">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                        {cart.items.length > 2 && (
                          <span className="text-muted-foreground">
                            +{cart.items.length - 2} mais
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      R$ {cart.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatDistanceToNow(new Date(cart.created_at), { addSuffix: true, locale: ptBR })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cart.recovery_attempts > 0 ? "secondary" : "outline"}>
                        {cart.recovery_attempts}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendRecoveryMessage(cart)}
                          disabled={sending === cart.id}
                        >
                          {sending === cart.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRecovered(cart.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AbandonedCartsManagement;
