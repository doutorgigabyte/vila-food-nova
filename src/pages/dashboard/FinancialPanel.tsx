/**
 * FinancialPanel - Painel financeiro completo com contas bancárias e histórico de transações
 */

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, History, CreditCard, TrendingUp } from 'lucide-react';
import { useUserEstablishment } from '@/hooks/useDashboardData';
import { usePayments } from '@/hooks/usePayments';
import { BankAccountSettings } from '@/components/financial/BankAccountSettings';
import { TransactionHistory } from '@/components/financial/TransactionHistory';
import { PaymentRevenueChart } from '@/components/dashboard/PaymentRevenueChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FinancialPanel() {
  const { establishmentId, loading: estLoading } = useUserEstablishment();
  const { processRefund, loading: refundLoading } = usePayments({ 
    establishmentId: establishmentId || undefined, 
    autoFetch: false 
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; transactionId: string; paymentId: string } | null>(null);

  const handleRefund = async (transactionId: string, paymentId: string) => {
    setRefundDialog({ open: true, transactionId, paymentId });
  };

  const confirmRefund = async () => {
    if (!refundDialog) return;
    
    const result = await processRefund(refundDialog.paymentId);
    if (result?.success) {
      toast.success('Estorno realizado com sucesso');
      setRefundDialog(null);
    }
  };

  if (estLoading) {
    return (
      <DashboardLayout title="Painel Financeiro">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!establishmentId) {
    return (
      <DashboardLayout title="Painel Financeiro">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Estabelecimento não encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Painel Financeiro">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Painel Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie seus pagamentos, contas bancárias e transações
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Transações</span>
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Contas Bancárias</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Análise de Receita</CardTitle>
                <CardDescription>
                  Visualize suas vendas e métodos de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentRevenueChart establishmentId={establishmentId} />
              </CardContent>
            </Card>

            {/* Quick Stats from TransactionHistory will be shown there */}
            <Card>
              <CardHeader>
                <CardTitle>Últimas Transações</CardTitle>
                <CardDescription>
                  Veja as transações mais recentes. Para mais detalhes, acesse a aba Transações.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Acesse a aba "Transações" para ver o histórico completo com filtros e exportação.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory 
              establishmentId={establishmentId} 
              onRefund={handleRefund}
            />
          </TabsContent>

          <TabsContent value="bank">
            <BankAccountSettings establishmentId={establishmentId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Refund Confirmation Dialog */}
      <Dialog open={!!refundDialog?.open} onOpenChange={(open) => !open && setRefundDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Estorno</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja estornar esta transação? O valor será devolvido ao cliente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRefund}
              disabled={refundLoading}
            >
              {refundLoading ? 'Processando...' : 'Confirmar Estorno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
