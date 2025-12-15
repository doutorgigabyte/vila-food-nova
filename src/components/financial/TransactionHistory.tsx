/**
 * TransactionHistory - Histórico detalhado de transações com filtros e exportação
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Download, 
  Filter, 
  Calendar as CalendarIcon, 
  MoreVertical,
  Eye,
  RotateCcw,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface TransactionHistoryProps {
  establishmentId: string;
  onRefund?: (transactionId: string, paymentId: string) => void;
}

interface Transaction {
  id: string;
  type: 'sale' | 'subscription' | 'refund';
  status: string;
  amount: number;
  platform_fee: number | null;
  net_amount: number | null;
  mp_payment_id: string | null;
  payer_email: string | null;
  payer_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-500',
  pending: 'bg-yellow-500',
  in_process: 'bg-blue-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-gray-500',
  refunded: 'bg-purple-500',
  charged_back: 'bg-orange-500',
};

const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  in_process: 'Processando',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
  charged_back: 'Chargeback',
};

type SortField = 'created_at' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

export function TransactionHistory({ establishmentId, onRefund }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchTransactions();
  }, [establishmentId]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('mp_transactions')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setTransactions(data as Transaction[] || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((t) => {
      // Search filter
      const matchesSearch = !searchTerm ||
        t.payer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.payer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.mp_payment_id?.includes(searchTerm) ||
        t.id.includes(searchTerm);

      // Status filter
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || t.type === typeFilter;

      // Date filter
      let matchesDate = true;
      if (dateRange?.from && dateRange?.to) {
        const transactionDate = new Date(t.created_at);
        matchesDate = isWithinInterval(transactionDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        });
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, statusFilter, typeFilter, dateRange, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Data', 'ID Pagamento', 'Tipo', 'Status', 'Pagador', 'Email', 'Valor Bruto', 'Taxa', 'Valor Líquido'];
    const rows = filteredAndSortedTransactions.map((t) => [
      format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
      t.mp_payment_id || t.id.slice(-8),
      t.type === 'sale' ? 'Venda' : t.type === 'subscription' ? 'Assinatura' : 'Estorno',
      STATUS_LABELS[t.status] || t.status,
      t.payer_name || '-',
      t.payer_email || '-',
      t.amount.toFixed(2),
      (t.platform_fee || 0).toFixed(2),
      (t.net_amount || t.amount).toFixed(2),
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';')),
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportação concluída');
  };

  const exportToJSON = () => {
    const data = filteredAndSortedTransactions.map(t => ({
      data: format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
      id_pagamento: t.mp_payment_id || t.id,
      tipo: t.type,
      status: t.status,
      pagador_nome: t.payer_name,
      pagador_email: t.payer_email,
      valor_bruto: t.amount,
      taxa_plataforma: t.platform_fee,
      valor_liquido: t.net_amount || t.amount,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportação concluída');
  };

  // Stats
  const stats = useMemo(() => {
    const filtered = filteredAndSortedTransactions;
    const approved = filtered.filter(t => t.status === 'approved' && t.type === 'sale');
    const pending = filtered.filter(t => t.status === 'pending');
    const refunded = filtered.filter(t => t.type === 'refund');

    return {
      total: filtered.reduce((sum, t) => sum + (t.type !== 'refund' ? t.amount : 0), 0),
      approved: approved.reduce((sum, t) => sum + t.amount, 0),
      pending: pending.reduce((sum, t) => sum + t.amount, 0),
      refunded: Math.abs(refunded.reduce((sum, t) => sum + t.amount, 0)),
      count: filtered.length,
    };
  }, [filteredAndSortedTransactions]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Período</p>
            <p className="text-2xl font-bold">R$ {stats.total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{stats.count} transações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aprovado</p>
            <p className="text-2xl font-bold text-green-600">R$ {stats.approved.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendente</p>
            <p className="text-2xl font-bold text-yellow-600">R$ {stats.pending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Estornado</p>
            <p className="text-2xl font-bold text-purple-600">R$ {stats.refunded.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Visualize e exporte todas as transações do seu estabelecimento
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchTransactions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToJSON}>
                    <FileText className="h-4 w-4 mr-2" />
                    JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="sale">Venda</SelectItem>
                <SelectItem value="subscription">Assinatura</SelectItem>
                <SelectItem value="refund">Estorno</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span>Selecionar período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Data
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagador</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Valor
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada com os filtros selecionados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(transaction.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {transaction.mp_payment_id?.slice(-8) || transaction.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.type === 'sale' ? 'Venda' :
                            transaction.type === 'subscription' ? 'Assinatura' : 'Estorno'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-white', STATUS_COLORS[transaction.status] || 'bg-gray-500')}>
                          {STATUS_LABELS[transaction.status] || transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px]">
                          <p className="font-medium truncate">{transaction.payer_name || '-'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {transaction.payer_email || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        R$ {(transaction.platform_fee || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        R$ {(transaction.net_amount || transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {transaction.status === 'approved' && transaction.type === 'sale' && onRefund && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => onRefund(transaction.id, transaction.mp_payment_id!)}
                                className="text-red-600"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Estornar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedTransactions.length > 0 && (
            <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
              <p>Mostrando {filteredAndSortedTransactions.length} de {transactions.length} transações</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
