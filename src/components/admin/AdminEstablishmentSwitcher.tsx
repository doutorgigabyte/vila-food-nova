import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, 
  ArrowLeft, 
  Search, 
  Shield,
  ExternalLink
} from 'lucide-react';

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: string;
}

const AdminEstablishmentSwitcher = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEstablishments();
    }
  }, [isOpen]);

  const fetchEstablishments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('id, name, slug, logo_url, status')
        .order('name');

      if (error) throw error;
      setEstablishments(data || []);
    } catch (error) {
      console.error('Error fetching establishments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logAdminAccess = async (establishmentId: string) => {
    if (!user?.id) return;
    
    try {
      await supabase
        .from('admin_access_logs')
        .insert({
          admin_user_id: user.id,
          establishment_id: establishmentId,
          action: 'access',
        });
    } catch (error) {
      console.error('Error logging access:', error);
    }
  };

  const handleAccessEstablishment = async (est: Establishment) => {
    await logAdminAccess(est.id);
    setIsOpen(false);
    navigate(`/painel/${est.slug}`);
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  const filteredEstablishments = establishments.filter(est =>
    est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    est.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Super Admin Badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Super Admin</span>
      </div>

      {/* Back to Admin Button */}
      {slug && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleBackToAdmin}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Admin
        </Button>
      )}

      {/* Establishment Switcher */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <Building2 className="w-4 h-4" />
            Trocar Estabelecimento
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Acessar Estabelecimento
            </DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar estabelecimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : filteredEstablishments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum estabelecimento encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEstablishments.map(est => (
                  <button
                    key={est.id}
                    onClick={() => handleAccessEstablishment(est)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {est.logo_url ? (
                        <img 
                          src={est.logo_url} 
                          alt={est.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{est.name}</p>
                      <p className="text-sm text-muted-foreground truncate">/{est.slug}</p>
                    </div>
                    <Badge 
                      variant={est.status === 'active' ? 'default' : 'secondary'}
                      className="shrink-0"
                    >
                      {est.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEstablishmentSwitcher;
