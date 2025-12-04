import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, Percent, DollarSign, Clock, TrendingUp, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashbackConfig {
  id?: string;
  percentage: number;
  min_order_value: number;
  max_cashback_value: number | null;
  expiration_days: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  created_at: string;
  expires_at: string | null;
  customers?: { name: string };
}

const CashbackManagement = () => {
  const [config, setConfig] = useState<CashbackConfig>({
    percentage: 5,
    min_order_value: 0,
    max_cashback_value: null,
    expiration_days: 30,
    is_active: false
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

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

      const [configRes, transactionsRes] = await Promise.all([
        supabase
          .from("cashback_config")
          .select("*")
          .eq("establishment_id", establishment.id)
          .maybeSingle(),
        supabase
          .from("cashback_transactions")
          .select("*, customers(name)")
          .eq("establishment_id", establishment.id)
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      if (configRes.data) {
        setConfig(configRes.data);
      }
      if (transactionsRes.data) {
        setTransactions(transactionsRes.data as Transaction[]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!establishmentId) return;
    setSaving(true);

    try {
      const payload = {
        establishment_id: establishmentId,
        percentage: config.percentage,
        min_order_value: config.min_order_value,
        max_cashback_value: config.max_cashback_value,
        expiration_days: config.expiration_days,
        is_active: config.is_active
      };

      if (config.id) {
        await supabase
          .from("cashback_config")
          .update(payload)
          .eq("id", config.id);
      } else {
        await supabase
          .from("cashback_config")
          .insert(payload);
      }

      toast.success("Configurações salvas!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const totalEarned = transactions.filter(t => t.type === "earned").reduce((acc, t) => acc + t.amount, 0);
  const totalUsed = transactions.filter(t => t.type === "used").reduce((acc, t) => acc + t.amount, 0);

  return (
    <DashboardLayout title="Cashback">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Concedido</p>
                <p className="text-xl font-bold">R$ {totalEarned.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Utilizado</p>
                <p className="text-xl font-bold">R$ {totalUsed.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo em Circulação</p>
                <p className="text-xl font-bold">R$ {(totalEarned - totalUsed).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Configuração do Cashback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Cashback Ativo</Label>
              <Switch
                checked={config.is_active}
                onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
              />
            </div>

            <div>
              <Label>Porcentagem do Cashback (%)</Label>
              <Input
                type="number"
                value={config.percentage}
                onChange={(e) => setConfig({ ...config, percentage: Number(e.target.value) })}
                min={0}
                max={100}
              />
            </div>

            <div>
              <Label>Valor Mínimo do Pedido (R$)</Label>
              <Input
                type="number"
                value={config.min_order_value}
                onChange={(e) => setConfig({ ...config, min_order_value: Number(e.target.value) })}
                min={0}
              />
            </div>

            <div>
              <Label>Valor Máximo de Cashback (R$)</Label>
              <Input
                type="number"
                value={config.max_cashback_value || ""}
                onChange={(e) => setConfig({ ...config, max_cashback_value: e.target.value ? Number(e.target.value) : null })}
                placeholder="Sem limite"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Validade (dias)
              </Label>
              <Input
                type="number"
                value={config.expiration_days}
                onChange={(e) => setConfig({ ...config, expiration_days: Number(e.target.value) })}
                min={1}
              />
            </div>

            <Button onClick={saveConfig} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </CardContent>
        </Card>

        {/* Transações */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma transação
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.slice(0, 10).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.customers?.name || "Cliente"}</TableCell>
                      <TableCell>
                        <Badge variant={t.type === "earned" ? "default" : t.type === "used" ? "secondary" : "destructive"}>
                          {t.type === "earned" ? "Ganho" : t.type === "used" ? "Usado" : "Expirado"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${t.type === "earned" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "earned" ? "+" : "-"}R$ {t.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(t.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CashbackManagement;
