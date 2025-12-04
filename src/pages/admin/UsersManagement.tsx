import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Users, 
  Search,
  Building2,
  Gift,
  Shield,
  Plus,
  Edit,
  Trash2,
  Phone,
  Calendar,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuditLog } from "@/hooks/useAuditLog";

interface User {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: string;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role || "customer"
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Erro ao carregar usuários", variant: "destructive" });
    } finally {
      setLoading(false);
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
                          user.phone?.includes(searchTerm);
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
      default: return "Cliente";
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
                  placeholder="Buscar por nome ou telefone..." 
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
        <Button variant="outline" className="gap-2">
          Adicionar <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead></TableHead>
                    <TableHead>NOME</TableHead>
                    <TableHead>E-MAIL</TableHead>
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
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.phone || "—"}
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
                          <Button variant="ghost" size="icon" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default UsersManagement;
