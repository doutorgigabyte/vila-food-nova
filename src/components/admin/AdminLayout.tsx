import { ReactNode } from 'react';
import AdminNavbar from './AdminNavbar';
import { Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  icon?: React.ElementType;
  breadcrumb?: string;
}

const AdminLayout = ({ children, title, icon: Icon, breadcrumb }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNavbar />
      
      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/admin" className="hover:text-foreground">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumb && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span>{breadcrumb}</span>
            </>
          )}
        </div>

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          {Icon && (
            <div className="bg-primary/10 p-4 rounded-2xl">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          )}
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>

        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
