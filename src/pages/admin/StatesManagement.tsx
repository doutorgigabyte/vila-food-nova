import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { MapPin, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';

interface State {
  id: string;
  name: string;
  uf: string;
  created_at: string | null;
}

const StatesManagement = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    uf: ''
  });

  // Fetch states
  const { data: states, isLoading } = useQuery({
    queryKey: ['admin-states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as State[];
    }
  });

  // Count cities per state
  const { data: cityCounts } = useQuery({
    queryKey: ['admin-cities-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('state_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(city => {
        if (city.state_id) {
          counts[city.state_id] = (counts[city.state_id] || 0) + 1;
        }
      });
      return counts;
    }
  });

  // Create state mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newState, error } = await supabase
        .from('states')
        .insert({
          name: data.name,
          uf: data.uf.toUpperCase()
        })
        .select()
        .single();
      
      if (error) throw error;
      return newState;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-states'] });
      logAction({ action: 'create', entityType: 'state', entityId: data.id, newData: data as any });
      toast.success('Estado criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar estado: ' + error.message);
    }
  });

  // Update state mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: updated, error } = await supabase
        .from('states')
        .update({
          name: data.name,
          uf: data.uf.toUpperCase()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-states'] });
      logAction({ action: 'update', entityType: 'state', entityId: data.id, oldData: selectedState as any, newData: data as any });
      toast.success('Estado atualizado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar estado: ' + error.message);
    }
  });

  // Delete state mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('states')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-states'] });
      logAction({ action: 'delete', entityType: 'state', entityId: id, oldData: selectedState as any });
      toast.success('Estado excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedState(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir estado: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      uf: ''
    });
    setSelectedState(null);
  };

  const handleEdit = (state: State) => {
    setSelectedState(state);
    setFormData({
      name: state.name,
      uf: state.uf
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (state: State) => {
    setSelectedState(state);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.uf) {
      toast.error('Nome e UF são obrigatórios');
      return;
    }

    if (formData.uf.length !== 2) {
      toast.error('UF deve ter 2 caracteres');
      return;
    }

    if (selectedState) {
      updateMutation.mutate({ id: selectedState.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredStates = states?.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.uf.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Gerenciar Estados" icon={MapPin} breadcrumb="Estados">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Estados Cadastrados ({states?.length || 0})</CardTitle>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Estado
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou UF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UF</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidades</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStates?.map((state) => (
                  <TableRow key={state.id}>
                    <TableCell className="font-bold">{state.uf}</TableCell>
                    <TableCell>{state.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cityCounts?.[state.id] || 0} cidades
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(state)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(state)}
                          disabled={(cityCounts?.[state.id] || 0) > 0}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStates?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum estado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedState ? 'Editar Estado' : 'Novo Estado'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="uf">UF *</Label>
              <Input
                id="uf"
                value={formData.uf}
                onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                placeholder="Ex: PE"
                maxLength={2}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pernambuco"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedState ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir estado?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o estado "{selectedState?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedState && deleteMutation.mutate(selectedState.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default StatesManagement;
