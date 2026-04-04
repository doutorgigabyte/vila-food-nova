import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldX, Store, Home } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { isAdmin, loading, user } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // User not logged in - show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
              <ShieldX className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Login Necessário</h2>
            <p className="text-muted-foreground">
              Você precisa estar logado para acessar esta área.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button asChild variant="outline">
                <Link to="/marketplace">
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Marketplace
                </Link>
              </Button>
              <Button asChild>
                <Link to="/auth">
                  Fazer Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User logged in but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="bg-destructive/10 p-4 rounded-full w-fit mx-auto">
              <ShieldX className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar a área administrativa.
              Entre em contato com um administrador se precisar de acesso.
            </p>
            <p className="text-xs text-muted-foreground">
              ID: {user.id.substring(0, 8)}...
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button asChild variant="outline">
                <Link to="/marketplace">
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Marketplace
                </Link>
              </Button>
              <Button asChild>
                <Link to="/painel">
                  <Store className="w-4 h-4 mr-2" />
                  Painel do Lojista
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
