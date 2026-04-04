import AdminLayout from '@/components/admin/AdminLayout';
import SupportInbox from '@/components/support/SupportInbox';
import { useUserEstablishment } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

const SupportManagement = () => {
  const { establishment, loading } = useUserEstablishment();

  if (loading) {
    return (
      <AdminLayout title="Central de Suporte">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!establishment) {
    return (
      <AdminLayout title="Central de Suporte">
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Estabelecimento não encontrado</p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Central de Suporte">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Gerencie as conversas de suporte com seus clientes
        </p>
        
        <SupportInbox establishmentId={establishment.id} />
      </div>
    </AdminLayout>
  );
};

export default SupportManagement;
