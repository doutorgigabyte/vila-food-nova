import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserEstablishment } from "@/hooks/useDashboardData";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Mail, Shield, UserX, UserCheck, Loader2, Trash2, Edit } from "lucide-react";

const roleLabels: Record<string, { label: string; color: string; description: string }> = {
  manager: { label: "Gerente", color: "bg-purple-500", description: "Acesso completo ao painel" },
  cashier: { label: "Caixa", color: "bg-green-500", description: "Acesso ao PDV e pagamentos" },
  waiter: { label: "Garçom", color: "bg-amber-500", description: "Acesso à comanda digital" },
  kitchen: { label: "Cozinha", color: "bg-orange-500", description: "Acesso ao KDS" },
  attendant: { label: "Atendente", color: "bg-blue-500", description: "Acesso básico a pedidos" },
  delivery: { label: "Entregador", color: "bg-cyan-500", description: "Acesso às entregas" },
};

const TeamManagement = () => {
  const { slug } = useParams();
  const { establishment, loading: loadingEstablishment } = useUserEstablishment();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "attendant",
  });

  const establishmentId = establishment?.id;

  // Fetch team members
  const { data: teamMembers, isLoading: loadingTeam } = useQuery({
    queryKey: ["team-members", establishmentId],
    queryFn: async () => {
      if (!establishmentId) return [];
      
      const { data, error } = await supabase
        .from("establishment_users")
        .select(`
          id,
          user_id,
          role,
          is_active,
          created_at
        `)
        .eq("establishment_id", establishmentId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user details for each team member
      const usersWithDetails = await Promise.all(
        (data || []).map(async (member) => {
          // Get user metadata from auth (we'll use profiles or fallback)
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", member.user_id)
            .single();

          return {
            ...member,
            name: profile?.full_name || "Usuário",
            avatar_url: profile?.avatar_url,
          };
        })
      );

      return usersWithDetails;
    },
    enabled: !!establishmentId,
  });

  // Create team member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!establishmentId) throw new Error("Estabelecimento não encontrado");

      // Call edge function to create user and link to establishment
      const response = await supabase.functions.invoke("create-team-member", {
        body: {
          email: data.email,
          name: data.name,
          role: data.role,
          establishment_id: establishmentId,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Colaborador adicionado",
        description: "Um convite foi enviado para o email informado.",
      });
      queryClient.invalidateQueries({ queryKey: ["team-members", establishmentId] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar colaborador",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Update team member role
  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, role, is_active }: { id: string; role?: string; is_active?: boolean }) => {
      const updates: any = {};
      if (role !== undefined) updates.role = role;
      if (is_active !== undefined) updates.is_active = is_active;

      const { error } = await supabase
        .from("establishment_users")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Colaborador atualizado" });
      queryClient.invalidateQueries({ queryKey: ["team-members", establishmentId] });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove team member
  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("establishment_users")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Colaborador removido" });
      queryClient.invalidateQueries({ queryKey: ["team-members", establishmentId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ email: "", name: "", role: "attendant" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMemberMutation.mutate(formData);
  };

  const isLoading = loadingEstablishment || loadingTeam;

  return (
    <div className="min-h-screen bg-muted/30 flex w-full overflow-hidden">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        establishment={establishment}
      />

      <main className="flex-1 lg:ml-64 overflow-x-hidden">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Users className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold truncate">Gestão de Equipe</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Colaborador</DialogTitle>
                  <DialogDescription>
                    Envie um convite para um novo membro da equipe.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do colaborador"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([key, { label, description }]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <span className="font-medium">{label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                - {description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMemberMutation.isPending}>
                      {createMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Enviar Convite
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teamMembers?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <UserCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {teamMembers?.filter((m) => m.is_active).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <UserX className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {teamMembers?.filter((m) => !m.is_active).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Inativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {teamMembers?.filter((m) => m.role === "manager").length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Gerentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members Table */}
          <Card>
            <CardHeader>
              <CardTitle>Membros da Equipe</CardTitle>
              <CardDescription>
                Gerencie os colaboradores com acesso ao painel do estabelecimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !teamMembers?.length ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum colaborador cadastrado.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar primeiro colaborador
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead className="hidden md:table-cell">Função</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => {
                        const roleInfo = roleLabels[member.role] || {
                          label: member.role,
                          color: "bg-gray-500",
                        };
                        const initials = member.name?.substring(0, 2).toUpperCase() || "??";

                        return (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={member.avatar_url} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{member.name}</p>
                                  <div className="md:hidden">
                                    <Badge
                                      className={`text-[10px] text-white whitespace-nowrap ${roleInfo.color}`}
                                    >
                                      {roleInfo.label}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge
                                className={`text-white whitespace-nowrap ${roleInfo.color}`}
                              >
                                {roleInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Switch
                                checked={member.is_active}
                                onCheckedChange={(checked) =>
                                  updateMemberMutation.mutate({
                                    id: member.id,
                                    is_active: checked,
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Select
                                  value={member.role}
                                  onValueChange={(value) =>
                                    updateMemberMutation.mutate({
                                      id: member.id,
                                      role: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(roleLabels).map(([key, { label }]) => (
                                      <SelectItem key={key} value={key}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    if (confirm("Remover este colaborador?")) {
                                      removeMemberMutation.mutate(member.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roles Info */}
          <Card>
            <CardHeader>
              <CardTitle>Funções Disponíveis</CardTitle>
              <CardDescription>
                Cada função tem permissões específicas no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(roleLabels).map(([key, { label, color, description }]) => (
                  <div
                    key={key}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <Badge className={`text-white whitespace-nowrap shrink-0 ${color}`}>
                      {label}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeamManagement;
