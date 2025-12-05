/**
 * PaymentsManagement - Dashboard de gestão de pagamentos
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreVertical,
  Search,
  Download,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { usePayments, Transaction } from '@/hooks/usePayments';
import { useUserEstablishment } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function PaymentsManagement() {
  const { establishmentId, loading: estLoading } = useUserEstablishment();
  const {
    transactions,
    stats,
    loading,
    fetchTransactions,
    processRefund,
    checkPaymentStatus,
    getStatusLabel,
    getStatusColor,
    getMethodLabel,
  } = usePayments({ establishmentId: establishmentId || undefined, autoFetch: !!establishmentId });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.payer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.payer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.mp_payment_id?.includes(searchTerm);

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'approved' && t.status === 'approved') ||
      (activeTab === 'pending' && t.status === 'pending') ||
      (activeTab === 'rejected' && ['rejected', 'cancelled'].includes(t.status)) ||
      (activeTab === 'refunded' && t.type === 'refund');

    return matchesSearch && matchesTab;
  });

  const handleRefund = async () => {
    if (!selectedTransaction?.mp_payment_id) return;

    setRefunding(true);
    await processRefund(selectedTransaction.mp_payment_id);
    setRefunding(false);
    setShowRefundDialog(false);
    setSelectedTransaction(null);
  };

  const handleCheckStatus = async (paymentId: string) => {
    const result = await checkPaymentStatus(paymentId);
    if (result?.success) {
      toast.success(`Status: ${getStatusLabel(result.status as any)}`);
      fetchTransactions();
    }
  };

  const exportTransactions = () => {
    const csv = [
      ['ID', 'Data', 'Tipo', 'Status', 'Valor', 'Taxa', 'Líquido', 'Pagador', 'Email'].join(','),
      ...filteredTransactions.map((t) =>
        [
          t.mp_payment_id || t.id,
          format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
          t.type,
          t.status,
          t.amount.toFixed(2),
          (t.platform_fee || 0).toFixed(2),
          (t.net_amount || t.amount).toFixed(2),
          t.payer_name || '',
          t.payer_email || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (estLoading) {
    return (
      <DashboardLayout title="Pagamentos">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pagamentos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pagamentos</h1>
            <p className="text-muted-foreground">
              Gerencie transações e acompanhe suas vendas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchTransactions()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={exportTransactions}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Aprovado</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {stats.totalApproved.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    R$ {stats.totalPending.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estornado</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {stats.totalRefunded.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <RotateCcw className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">
                    R$ {stats.averageTicket.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Transações</CardTitle>
                <CardDescription>
                  {stats.transactionCount} transações registradas
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email, nome ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="approved">Aprovadas</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="rejected">Recusadas</TabsTrigger>
                <TabsTrigger value="refunded">Estornos</TabsTrigger>
              </TabsList>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagador</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(transaction.created_at), "dd/MM/yy HH:mm", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {transaction.mp_payment_id?.slice(-8) || transaction.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.type === 'sale'
                                ? 'Venda'
                                : transaction.type === 'subscription'
                                ? 'Assinatura'
                                : 'Estorno'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getStatusColor(
                                transaction.status as any
                              )} text-white`}
                            >
                              {getStatusLabel(transaction.status as any)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate">
                              <p className="font-medium truncate">
                                {transaction.payer_name || '-'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {transaction.payer_email || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {Math.abs(transaction.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            R$ {(transaction.net_amount || transaction.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setShowDetails(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                {transaction.mp_payment_id && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleCheckStatus(transaction.mp_payment_id!)
                                    }
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Verificar status
                                  </DropdownMenuItem>
                                )}
                                {transaction.status === 'approved' &&
                                  transaction.type === 'sale' && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedTransaction(transaction);
                                        setShowRefundDialog(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Estornar
                                    </DropdownMenuItem>
                                  )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Transaction Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Transação</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">ID do Pagamento</p>
                    <p className="font-mono">{selectedTransaction.mp_payment_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge
                      className={`${getStatusColor(selectedTransaction.status as any)} text-white`}
                    >
                      {getStatusLabel(selectedTransaction.status as any)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p>
                      {selectedTransaction.type === 'sale'
                        ? 'Venda'
                        : selectedTransaction.type === 'subscription'
                        ? 'Assinatura'
                        : 'Estorno'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p>
                      {format(new Date(selectedTransaction.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Bruto</p>
                    <p className="font-medium">R$ {selectedTransaction.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taxa da Plataforma</p>
                    <p className="text-red-600">
                      R$ {(selectedTransaction.platform_fee || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Líquido</p>
                    <p className="font-medium text-green-600">
                      R$ {(selectedTransaction.net_amount || selectedTransaction.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pagador</p>
                    <p>{selectedTransaction.payer_name || '-'}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedTransaction.payer_email || '-'}
                    </p>
                  </div>
                </div>
                {selectedTransaction.metadata && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Metadados</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Refund Confirmation Dialog */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Confirmar Estorno
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja estornar esta transação? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="py-4">
                <p className="text-sm text-muted-foreground">Valor a estornar:</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {selectedTransaction.amount.toFixed(2)}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleRefund} disabled={refunding}>
                {refunding ? 'Processando...' : 'Confirmar Estorno'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
