import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Plus, TrendingUp, TrendingDown, DollarSign, CreditCard, Banknote, Check, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { format, parseISO, isAfter, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  category: string;
  type: string;
  amount: number;
  description: string | null;
  due_date: string | null;
  paid_at: string | null;
  status: string;
  created_at: string;
  financial_accounts?: { name: string };
}

const accountTypes = [
  { value: "bank", label: "Conta Bancária", icon: Banknote },
  { value: "cash", label: "Dinheiro", icon: DollarSign },
  { value: "credit_card", label: "Cartão de Crédito", icon: CreditCard },
  { value: "other", label: "Outro", icon: Wallet },
];

const categories = {
  income: ["Vendas", "Serviços", "Investimentos", "Outros"],
  expense: ["Fornecedores", "Funcionários", "Aluguel", "Energia", "Água", "Internet", "Marketing", "Manutenção", "Impostos", "Outros"]
};

const AdvancedFinanceManagement = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  
  const [accountForm, setAccountForm] = useState({ name: "", type: "bank", balance: 0 });
  const [transactionForm, setTransactionForm] = useState({
    account_id: "",
    type: "expense",
    category: "",
    amount: "",
    description: "",
    due_date: "",
    status: "pending"
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

      const [accountsRes, transactionsRes] = await Promise.all([
        supabase
          .from("financial_accounts")
          .select("*")
          .eq("establishment_id", establishment.id)
          .order("name"),
        supabase
          .from("financial_transactions")
          .select("*, financial_accounts(name)")
          .eq("establishment_id", establishment.id)
          .order("due_date", { ascending: true })
          .limit(100)
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data as Transaction[]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    if (!establishmentId || !accountForm.name) {
      toast.error("Preencha o nome da conta");
      return;
    }

    try {
      await supabase.from("financial_accounts").insert({
        establishment_id: establishmentId,
        ...accountForm
      });

      toast.success("Conta criada!");
      setAccountDialogOpen(false);
      setAccountForm({ name: "", type: "bank", balance: 0 });
      fetchData();
    } catch (error) {
      toast.error("Erro ao criar conta");
    }
  };

  const createTransaction = async () => {
    if (!establishmentId || !transactionForm.category || !transactionForm.amount) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await supabase.from("financial_transactions").insert({
        establishment_id: establishmentId,
        account_id: transactionForm.account_id || null,
        type: transactionForm.type,
        category: transactionForm.category,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description || null,
        due_date: transactionForm.due_date || null,
        status: transactionForm.status
      });

      toast.success("Transação registrada!");
      setTransactionDialogOpen(false);
      setTransactionForm({
        account_id: "",
        type: "expense",
        category: "",
        amount: "",
        description: "",
        due_date: "",
        status: "pending"
      });
      fetchData();
    } catch (error) {
      toast.error("Erro ao registrar");
    }
  };

  const markAsPaid = async (transaction: Transaction) => {
    try {
      await supabase
        .from("financial_transactions")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", transaction.id);

      toast.success("Marcado como pago!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const pendingExpenses = transactions.filter(t => t.type === "expense" && t.status === "pending");
  const pendingIncome = transactions.filter(t => t.type === "income" && t.status === "pending");
  const overdueTransactions = transactions.filter(t => 
    t.status === "pending" && t.due_date && isBefore(parseISO(t.due_date), startOfDay(new Date()))
  );

  return (
    <DashboardLayout title="Gestão Financeira">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <p className="text-xl font-bold">R$ {totalBalance.toFixed(2)}</p>
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
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-xl font-bold">
                  R$ {pendingIncome.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">A Pagar</p>
                <p className="text-xl font-bold">
                  R$ {pendingExpenses.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencidas</p>
                <p className="text-xl font-bold">{overdueTransactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Contas</CardTitle>
            <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Conta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      placeholder="Ex: Conta Corrente"
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={accountForm.type} onValueChange={(v) => setAccountForm({ ...accountForm, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Saldo Inicial</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={accountForm.balance}
                      onChange={(e) => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <Button onClick={createAccount} className="w-full">Criar Conta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {accounts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma conta</p>
            ) : (
              accounts.map((account) => {
                const typeInfo = accountTypes.find(t => t.value === account.type);
                const Icon = typeInfo?.icon || Wallet;
                return (
                  <div key={account.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{typeInfo?.label}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      R$ {account.balance.toFixed(2)}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Transações</CardTitle>
            <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Transação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={transactionForm.type} onValueChange={(v) => setTransactionForm({ ...transactionForm, type: v, category: "" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={transactionForm.category} onValueChange={(v) => setTransactionForm({ ...transactionForm, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories[transactionForm.type as keyof typeof categories]?.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Conta (opcional)</Label>
                    <Select value={transactionForm.account_id} onValueChange={(v) => setTransactionForm({ ...transactionForm, account_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vencimento</Label>
                    <Input
                      type="date"
                      value={transactionForm.due_date}
                      onChange={(e) => setTransactionForm({ ...transactionForm, due_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                      placeholder="Descrição opcional"
                    />
                  </div>
                  <Button onClick={createTransaction} className="w-full">Registrar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="paid">Pagas</TabsTrigger>
              </TabsList>
              <TabsContent value="pending">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.filter(t => t.status === "pending").map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{t.category}</p>
                              {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {t.due_date ? (
                              <Badge variant={
                                isBefore(parseISO(t.due_date), startOfDay(new Date())) 
                                  ? "destructive" 
                                  : "outline"
                              }>
                                {format(parseISO(t.due_date), "dd/MM")}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                            {t.type === "income" ? "+" : "-"}R$ {t.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => markAsPaid(t)}>
                              <Check className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="paid">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Pago em</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.filter(t => t.status === "paid").map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{t.category}</p>
                              {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {t.paid_at && format(parseISO(t.paid_at), "dd/MM", { locale: ptBR })}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                            {t.type === "income" ? "+" : "-"}R$ {t.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdvancedFinanceManagement;
