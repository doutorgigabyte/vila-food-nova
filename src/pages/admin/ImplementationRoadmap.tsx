import AdminLayout from '@/components/admin/AdminLayout';
import { ImplementationProgress } from '@/components/admin/ImplementationProgress';

const ImplementationRoadmap = () => {
  return (
    <AdminLayout title="Roadmap de Implementação">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Acompanhe o progresso do desenvolvimento do VilaFood
        </p>

        <ImplementationProgress />
      </div>
    </AdminLayout>
  );
};

export default ImplementationRoadmap;
