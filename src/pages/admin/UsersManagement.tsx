import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Search,
  Building2,
  Gift,
  Shield,
  Plus,
  Edit,
  Trash2,
  Filter,
  Store
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuditLog } from "@/hooks/useAuditLog";

interface EstablishmentInfo {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  email?: string;
  establishments: EstablishmentInfo[];
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { logAction } = useAuditLog();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Establishments for linking
  const [establishments, setEstablishments] = useState<Establishment[]>([]);

  // Form fields
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    role: "customer",
    establishment_id: "",
    establishment_role: "attendant",
  });

  useEffect(() => {
    fetchUsers();
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    const { data } = await supabase.from("establishments").select("id, name, slug");
    if (data) setEstablishments(data);
  };

  const fetchUsers = async () => {
    try {
      // Buscar profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Buscar establishment_users com dados do estabelecimento
      const { data: establishmentUsers, error: euError } = await supabase
        .from("establishment_users")
        .select(`
          user_id,
          role,
          establishment_id,
          establishments (
            id,
            name,
            slug
          )
        `);

      if (euError) throw euError;

      // Buscar estabelecimentos onde o usuário é owner
      const { data: ownedEstablishments, error: oeError } = await supabase
        .from("establishments")
        .select("id, name, slug, owner_id");

      if (oeError) throw oeError;

      // Combinar todos os dados
      const usersWithRolesAndEstablishments = profiles?.map(profile => {
        // Roles do usuário (pegar primeira role não-customer se existir)
        const userRoles = roles?.filter(r => r.user_id === profile.id) || [];
        const primaryRole = userRoles.find(r => r.role !== 'customer')?.role || 
                           userRoles[0]?.role || 'customer';

        // Estabelecimentos vinculados via establishment_users
        const linkedEstablishments = establishmentUsers
          ?.filter(eu => eu.user_id === profile.id && eu.establishments)
          .map(eu => ({
            id: (eu.establishments as any).id,
            name: (eu.establishments as any).name,
            slug: (eu.establishments as any).slug,
            role: eu.role
          })) || [];

        // Estabelecimentos onde é owner
        const owned = ownedEstablishments
          ?.filter(e => e.owner_id === profile.id)
          .map(e => ({
            id: e.id,
            name: e.name,
            slug: e.slug,
            role: 'owner'
          })) || [];

        // Combinar sem duplicatas
        const allEstablishments = [...owned];
        linkedEstablishments.forEach(le => {
          if (!allEstablishments.find(e => e.id === le.id)) {
            allEstablishments.push(le);
          }
        });

        return {
          ...profile,
          role: primaryRole,
          establishments: allEstablishments
        };
      }) || [];

      setUsers(usersWithRolesAndEstablishments);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Erro ao carregar usuários", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      role: "customer",
      establishment_id: "",
      establishment_role: "attendant",
    });
    setEditingUser(null);
  };

  const openEditDialog = (user: User) => {
    if (!user) {
      toast({ title: "Erro ao abrir usuário", variant: "destructive" });
      return;
    }
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      phone: user.phone || "",
      role: user.role || "customer",
      establishment_id: user.establishments?.[0]?.id || "",
      establishment_role: user.establishments?.[0]?.role || "attendant",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingUser) {
      toast({ title: "Criação de usuário não implementada (requer auth.users)", variant: "destructive" });
      return;
    }

    try {
      // Atualizar profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq("id", editingUser.id);

      if (profileError) throw profileError;

      // Atualizar role
      await supabase.from("user_roles").delete().eq("user_id", editingUser.id);
      await supabase.from("user_roles").insert({ user_id: editingUser.id, role: formData.role as any });

      // Atualizar vínculo com estabelecimento se selecionado
      if (formData.establishment_id) {
        await supabase.from("establishment_users").delete().eq("user_id", editingUser.id);
        await supabase.from("establishment_users").insert({
          user_id: editingUser.id,
          establishment_id: formData.establishment_id,
          role: formData.establishment_role,
        });
      }

      await logAction({
        action: 'update_user',
        entityType: 'user',
        entityId: editingUser.id,
        newData: formData as any
      });

      toast({ title: "Usuário atualizado!" });
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({ title: "Erro ao atualizar usuário", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      // Block deletion if the user still owns establishments. Cascading the
      // delete here would orphan stores (and their products / orders / FK
      // chains), and the admin almost never wants that — they want to either
      // transfer ownership first or block the account instead.
      const { count: ownedCount, error: ownedErr } = await supabase
        .from('establishments')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', deletingId);

      if (ownedErr) throw ownedErr;

      if ((ownedCount ?? 0) > 0) {
        toast({
          title: 'Não é possível excluir',
          description: `Este usuário é dono de ${ownedCount} estabelecimento(s). Transfira a propriedade ou exclua as lojas antes.`,
          variant: 'destructive',
        });
        setDeleteDialogOpen(false);
        setDeletingId(null);
        return;
      }

      // Delete dependents in order — Supabase JS doesn't expose multi-table
      // transactions, but we collect errors so a partial failure surfaces
      // instead of silently leaving the user in a half-deleted state.
      const [rolesRes, eUsersRes] = await Promise.all([
        supabase.from('user_roles').delete().eq('user_id', deletingId),
        supabase.from('establishment_users').delete().eq('user_id', deletingId),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (eUsersRes.error) throw eUsersRes.error;

      const { error } = await supabase.from('profiles').delete().eq('id', deletingId);
      if (error) throw error;

      await logAction({
        action: 'delete_user',
        entityType: 'user',
        entityId: deletingId
      });

      toast({ title: "Usuário excluído!" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Erro ao excluir usuário", variant: "destructive" });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const user = users.find(u => u.id === userId);
    try {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole as any }]);

      if (insertError) throw insertError;

      await logAction({
        action: 'update_user_role',
        entityType: 'user',
        entityId: userId,
        oldData: { role: user?.role },
        newData: { role: newRole }
      });

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({ title: "Role atualizada com sucesso!" });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({ title: "Erro ao atualizar role", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.phone?.includes(searchTerm) ||
                          user.establishments.some(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string): "destructive" | "default" | "secondary" | "outline" => {
    switch (role) {
      case "super_admin": return "destructive";
      case "establishment": return "default";
      case "affiliate": return "secondary";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin": return "Adm";
      case "admin": return "Admin";
      case "establishment": return "Loja";
      case "affiliate": return "Afiliado";
      case "manager": return "Gestor";
      case "cashier": return "Caixa";
      case "attendant": return "Atendente";
      case "owner": return "Dono";
      default: return "Cliente";
    }
  };

  const getEstablishmentRoleBadge = (role?: string) => {
    switch (role) {
      case "owner": return <Badge variant="destructive" className="text-xs">Dono</Badge>;
      case "manager": return <Badge variant="default" className="text-xs">Gestor</Badge>;
      case "cashier": return <Badge variant="secondary" className="text-xs">Caixa</Badge>;
      case "attendant": return <Badge variant="outline" className="text-xs">Atendente</Badge>;
      default: return null;
    }
  };

  return (
    <AdminLayout title="Usuários" icon={Users} breadcrumb="Usuários">
      {/* Filter Bar */}
      <Card className="mb-6 bg-destructive/10 border-destructive/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <Filter className="h-5 w-5" />
              <span>Filtrar</span>
            </div>
            <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome, telefone ou loja..." 
                  className="pl-10 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48 bg-background">
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="establishment">Loja</SelectItem>
                  <SelectItem value="affiliate">Afiliado</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-xl font-bold">{users.filter(u => u.role === "super_admin" || u.role === "admin").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lojas</p>
                <p className="text-xl font-bold">{users.filter(u => u.role === "establishment").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Afiliados</p>
                <p className="text-xl font-bold">{users.filter(u => u.role === "affiliate").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats and Add Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredUsers.length} Registros
          </Badge>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => {
            toast({ title: "Criar usuário requer cadastro via Auth", description: "Use o formulário de registro" });
          }}
        >
          Adicionar <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block md:hidden divide-y">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <Users className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{user.full_name || "Sem nome"}</p>
                          {user.phone && (
                            <p className="text-xs text-muted-foreground">{user.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => {
                            setDeletingId(user.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs">
                          <Badge variant={getRoleBadgeVariant(user.role || "customer")} className="text-xs">
                            {getRoleLabel(user.role || "customer")}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Cliente</SelectItem>
                          <SelectItem value="establishment">Loja</SelectItem>
                          <SelectItem value="affiliate">Afiliado</SelectItem>
                          <SelectItem value="manager">Gestor</SelectItem>
                          <SelectItem value="cashier">Caixa</SelectItem>
                          <SelectItem value="attendant">Atendente</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge className="bg-green-500 text-xs">Ativo</Badge>
                    </div>
                    {user.establishments.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Estabelecimentos: </span>
                        {user.establishments.map(est => est.name).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead></TableHead>
                      <TableHead>NOME</TableHead>
                      <TableHead>ESTABELECIMENTO</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>LEVEL</TableHead>
                      <TableHead className="text-right">AÇÕES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="w-16">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <Users className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.full_name || "Sem nome"}</span>
                          {user.phone && (
                            <p className="text-xs text-muted-foreground">{user.phone}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.establishments.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {user.establishments.map((est) => (
                                <div key={est.id} className="flex items-center gap-2">
                                  <Store className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm">{est.name}</span>
                                  {getEstablishmentRoleBadge(est.role)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">Ativo</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <Badge variant={getRoleBadgeVariant(user.role || "customer")}>
                                {getRoleLabel(user.role || "customer")}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Cliente</SelectItem>
                              <SelectItem value="establishment">Loja</SelectItem>
                              <SelectItem value="affiliate">Afiliado</SelectItem>
                              <SelectItem value="manager">Gestor</SelectItem>
                              <SelectItem value="cashier">Caixa</SelectItem>
                              <SelectItem value="attendant">Atendente</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Editar"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Excluir" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingId(user.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nome do usuário"
              />
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(81) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label>Role do sistema</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="establishment">Loja</SelectItem>
                  <SelectItem value="affiliate">Afiliado</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vincular a estabelecimento</Label>
              <Select 
                value={formData.establishment_id || "none"} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, establishment_id: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {establishments.map(est => (
                    <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.establishment_id && (
              <div className="space-y-2">
                <Label>Cargo no estabelecimento</Label>
                <Select 
                  value={formData.establishment_role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, establishment_role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="cashier">Caixa</SelectItem>
                    <SelectItem value="attendant">Atendente</SelectItem>
                    <SelectItem value="waiter">Garçom</SelectItem>
                    <SelectItem value="delivery">Entregador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button className="w-full" onClick={handleSubmit}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O perfil do usuário e todos os vínculos serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default UsersManagement;
