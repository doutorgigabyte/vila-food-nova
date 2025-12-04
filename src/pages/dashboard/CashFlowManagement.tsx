import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Loader2, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashFlowEntry {
  id: string;
  type: string;
  category: string | null;
  description: string | null;
  amount: number;
  payment_method: string | null;
  created_at: string | null;
}

const categories = {
  income: ["Vendas", "Pedidos Online", "PDV", "Outros"],
  expense: ["Fornecedores", "Funcionários", "Aluguel", "Luz/Água", "Internet", "Marketing", "Manutenção", "Outros"],
};

const CashFlowManagement = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    category: "",
    description: "",
    amount: "",
    payment_method: "",
  });

  useEffect(() => {
    if (user) fetchEstablishment();
  }, [user]);

  useEffect(() => {
    if (establishmentId) fetchEntries();
  }, [establishmentId]);

  const fetchEstablishment = async () => {
    const { data } = await supabase
      .from("establishments")
      .select("id")
      .eq("owner_id", user?.id)
      .maybeSingle();
    if (data) setEstablishmentId(data.id);
  };

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cash_flow")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) toast.error("Erro ao carregar fluxo de caixa");
    else setEntries(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.amount || !form.category) {
      toast.error("Valor e categoria são obrigatórios");
      return;
    }

    setSaving(true);
    const entryData = {
      type: form.type,
      category: form.category,
      description: form.description || null,
      amount: parseFloat(form.amount),
      payment_method: form.payment_method || null,
      establishment_id: establishmentId,
    };

    try {
      const { error } = await supabase.from("cash_flow").insert(entryData);
      if (error) throw error;
      toast.success("Lançamento registrado!");
      setIsDialogOpen(false);
      setForm({ type: "income", category: "", description: "", amount: "", payment_method: "" });
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar lançamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: CashFlowEntry) => {
    if (!confirm("Deseja excluir este lançamento?")) return;
    const { error } = await supabase.from("cash_flow").delete().eq("id", entry.id);
    if (error) toast.error("Erro ao excluir lançamento");
    else {
      toast.success("Lançamento excluído!");
      fetchEntries();
    }
  };

  const filteredEntries = entries.filter((e) => filter === "all" || e.type === filter);

  const totalIncome = entries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/painel">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Fluxo de Caixa</h1>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entradas</p>
                  <p className="text-xl font-bold text-green-600">R$ {totalIncome.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saídas</p>
                  <p className="text-xl font-bold text-red-600">R$ {totalExpense.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${balance >= 0 ? "bg-blue-100 dark:bg-blue-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
                  <DollarSign className={`w-5 h-5 ${balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-yellow-600 dark:text-yellow-400"}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-xl font-bold ${balance >= 0 ? "text-blue-600" : "text-yellow-600"}`}>
                    R$ {balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
          <Button
            variant={filter === "income" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("income")}
          >
            Entradas
          </Button>
          <Button
            variant={filter === "expense" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("expense")}
          >
            Saídas
          </Button>
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${entry.type === "income" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    {entry.type === "income" ? (
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{entry.category}</h3>
                      {entry.payment_method && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{entry.payment_method}</span>
                      )}
                    </div>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground truncate">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      {entry.created_at && format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${entry.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {entry.type === "income" ? "+" : "-"} R$ {entry.amount.toFixed(2)}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(entry)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(value: "income" | "expense") => setForm({ ...form, type: value, category: "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories[form.type].map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="100.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={form.payment_method}
                onValueChange={(value) => setForm({ ...form, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes do lançamento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashFlowManagement;
