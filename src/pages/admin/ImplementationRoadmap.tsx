import AdminLayout from '@/components/admin/AdminLayout';
import SystemChecklistProgress from '@/components/admin/SystemChecklistProgress';

const ImplementationRoadmap = () => {
  return (
    <AdminLayout title="Checklist de Produção">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Valide cada funcionalidade antes do deploy para produção
        </p>

        <SystemChecklistProgress />
      </div>
    </AdminLayout>
  );
};

export default ImplementationRoadmap;
