import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Clock, Lightbulb, Store, Search } from "lucide-react";

type SuggestionStatus = "pending" | "approved" | "rejected" | "all";

export default function CategorySuggestionsManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["category-suggestions", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("category_suggestions")
        .select(`
          *,
          establishments(name, logo_url),
          segments(name, icon)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (suggestion: any) => {
      const { data: user } = await supabase.auth.getUser();

      // Create new segment (global category)
      const { error: segmentError } = await supabase.from("segments").insert({
        name: suggestion.name,
        description: suggestion.description,
        icon: "📦",
        is_active: true,
      });

      if (segmentError) throw segmentError;

      // Update suggestion status
      const { error: updateError } = await supabase
        .from("category_suggestions")
        .update({
          status: "approved",
          reviewed_by: user.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", suggestion.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success("Categoria aprovada e adicionada ao sistema!");
    },
    onError: (error) => {
      console.error("Error approving suggestion:", error);
      toast.error("Erro ao aprovar categoria");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      suggestion,
      reason,
    }: {
      suggestion: any;
      reason: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("category_suggestions")
        .update({
          status: "rejected",
          reviewed_by: user.user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq("id", suggestion.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-suggestions"] });
      toast.success("Sugestão rejeitada. Categoria permanece local.");
      setRejectDialogOpen(false);
      setSelectedSuggestion(null);
      setRejectionReason("");
    },
    onError: (error) => {
      console.error("Error rejecting suggestion:", error);
      toast.error("Erro ao rejeitar sugestão");
    },
  });

  const handleReject = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedSuggestion) {
      rejectMutation.mutate({
        suggestion: selectedSuggestion,
        reason: rejectionReason,
      });
    }
  };

  const filteredSuggestions = suggestions?.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.establishments?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="gap-1 bg-green-500">
            <Check className="h-3 w-3" />
            Aprovada
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3 w-3" />
            Rejeitada
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingCount =
    suggestions?.filter((s) => s.status === "pending").length || 0;

  return (
    <AdminLayout
      title="Sugestões de Categorias"
      breadcrumb="Categorias > Sugestões"
    >
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suggestions?.filter((s) => s.status === "approved").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
              <X className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suggestions?.filter((s) => s.status === "rejected").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Sugestões de Lojistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou loja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as SuggestionStatus)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovadas</SelectItem>
                  <SelectItem value="rejected">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : filteredSuggestions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma sugestão encontrada
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuggestions?.map((suggestion) => (
                      <TableRow key={suggestion.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{suggestion.name}</p>
                            {suggestion.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {suggestion.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <span>{suggestion.establishments?.name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {suggestion.segments ? (
                            <span>
                              {suggestion.segments.icon} {suggestion.segments.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(suggestion.created_at),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(suggestion.status)}</TableCell>
                        <TableCell className="text-right">
                          {suggestion.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => approveMutation.mutate(suggestion)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                                onClick={() => handleReject(suggestion)}
                              >
                                <X className="h-4 w-4" />
                                Rejeitar
                              </Button>
                            </div>
                          )}
                          {suggestion.status === "rejected" &&
                            suggestion.rejection_reason && (
                              <span
                                className="text-sm text-muted-foreground"
                                title={suggestion.rejection_reason}
                              >
                                {suggestion.rejection_reason.slice(0, 30)}...
                              </span>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Sugestão</DialogTitle>
            <DialogDescription>
              A categoria "{selectedSuggestion?.name}" permanecerá disponível
              apenas para a loja que a criou.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Motivo da rejeição (opcional)
              </label>
              <Textarea
                placeholder="Ex: Categoria já existe com outro nome..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={rejectMutation.isPending}
              >
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
