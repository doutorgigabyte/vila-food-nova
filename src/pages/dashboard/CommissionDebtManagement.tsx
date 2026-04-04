import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CommissionDebtPanel from '@/components/dashboard/CommissionDebtPanel';
import { useEstablishment } from '@/hooks/useEstablishment';
import { Skeleton } from '@/components/ui/skeleton';

const CommissionDebtManagement = () => {
  const { slug } = useParams();
  const { establishment, loading } = useEstablishment(slug);

  if (loading) {
    return (
      <DashboardLayout title="Extrato de Comissões">
        <Skeleton className="h-96" />
      </DashboardLayout>
    );
  }

  if (!establishment) {
    return (
      <DashboardLayout title="Extrato de Comissões">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Estabelecimento não encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Extrato de Comissões">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Extrato de Comissões</h1>
          <p className="text-muted-foreground">
            Acompanhe as comissões de pedidos pagos na entrega
          </p>
        </div>

        <CommissionDebtPanel establishmentId={establishment.id} />
      </div>
    </DashboardLayout>
  );
};

export default CommissionDebtManagement;
