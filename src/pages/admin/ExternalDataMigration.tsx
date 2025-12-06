import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Database, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MigrationResult {
  id: string;
  name: string;
  status: string;
  reason?: string;
  error?: string;
  new_id?: string;
}

interface ExternalData {
  produtos?: { count: number; data?: any[]; sample?: any[]; error?: string };
  categorias?: { count: number; data?: any[]; sample?: any[]; error?: string };
  estabelecimentos?: { count: number; data?: any[]; sample?: any[]; error?: string };
  id_mapping?: { count: number; data?: any[]; sample?: any[]; error?: string };
}

export default function ExternalDataMigration() {
  const [loading, setLoading] = useState<string | null>(null);
  const [externalData, setExternalData] = useState<ExternalData | null>(null);
  const [migrationResults, setMigrationResults] = useState<{
    categories?: MigrationResult[];
    products?: MigrationResult[];
  }>({});

  const runAction = async (action: string) => {
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-external-data", {
        body: { action },
      });

      if (error) throw error;

      if (action === "check_external" || action === "get_all_external_data") {
        setExternalData(data.data);
        toast.success("Dados externos carregados!");
      } else if (action === "migrate_categories") {
        setMigrationResults(prev => ({ ...prev, categories: data.results }));
        toast.success(`Migração de categorias: ${data.results?.filter((r: MigrationResult) => r.status === "success").length}/${data.total} sucesso`);
      } else if (action === "migrate_products") {
        setMigrationResults(prev => ({ ...prev, products: data.results }));
        toast.success(`Migração de produtos: ${data.results?.filter((r: MigrationResult) => r.status === "success").length}/${data.total} sucesso`);
      }

      return data;
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro na operação");
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Sucesso</Badge>;
      case "skipped":
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Ignorado</Badge>;
      case "error":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Migração de Dados Externos</h1>
            <p className="text-muted-foreground">Transferir dados do projeto Supabase externo para o atual</p>
          </div>
        </div>

        {/* Step 1: Check External Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Passo 1: Verificar Dados Externos
            </CardTitle>
            <CardDescription>
              Conectar ao projeto externo e verificar estrutura das tabelas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => runAction("check_external")}
                disabled={loading !== null}
              >
                {loading === "check_external" && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Verificar Amostra
              </Button>
              <Button
                variant="outline"
                onClick={() => runAction("get_all_external_data")}
                disabled={loading !== null}
              >
                {loading === "get_all_external_data" && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Carregar Todos os Dados
              </Button>
            </div>

            {externalData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{externalData.produtos?.count ?? 0}</div>
                    <div className="text-sm text-muted-foreground">Produtos</div>
                    {externalData.produtos?.error && (
                      <div className="text-xs text-red-500 mt-1">{externalData.produtos.error}</div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{externalData.categorias?.count ?? 0}</div>
                    <div className="text-sm text-muted-foreground">Categorias</div>
                    {externalData.categorias?.error && (
                      <div className="text-xs text-red-500 mt-1">{externalData.categorias.error}</div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{externalData.estabelecimentos?.count ?? 0}</div>
                    <div className="text-sm text-muted-foreground">Estabelecimentos</div>
                    {externalData.estabelecimentos?.error && (
                      <div className="text-xs text-red-500 mt-1">{externalData.estabelecimentos.error}</div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{externalData.id_mapping?.count ?? 0}</div>
                    <div className="text-sm text-muted-foreground">Mapeamentos</div>
                    {externalData.id_mapping?.error && (
                      <div className="text-xs text-red-500 mt-1">{externalData.id_mapping.error}</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {externalData?.id_mapping?.sample && externalData.id_mapping.sample.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Amostra de Mapeamentos:</h4>
                <ScrollArea className="h-40 border rounded p-2">
                  <pre className="text-xs">{JSON.stringify(externalData.id_mapping.sample, null, 2)}</pre>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Migrate Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Passo 2: Migrar Categorias</CardTitle>
            <CardDescription>
              Transferir categorias usando o mapeamento de IDs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => runAction("migrate_categories")}
              disabled={loading !== null}
            >
              {loading === "migrate_categories" && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Migrar Categorias
            </Button>

            {migrationResults.categories && (
              <div className="mt-4">
                <div className="flex gap-4 mb-2">
                  <span className="text-sm">
                    Sucesso: {migrationResults.categories.filter(r => r.status === "success").length}
                  </span>
                  <span className="text-sm">
                    Ignorados: {migrationResults.categories.filter(r => r.status === "skipped").length}
                  </span>
                  <span className="text-sm">
                    Erros: {migrationResults.categories.filter(r => r.status === "error").length}
                  </span>
                </div>
                <ScrollArea className="h-60 border rounded">
                  <div className="p-2 space-y-1">
                    {migrationResults.categories.map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b">
                        <span>{result.name || result.id}</span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(result.status)}
                          {result.reason && <span className="text-xs text-muted-foreground">{result.reason}</span>}
                          {result.error && <span className="text-xs text-red-500">{result.error}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Migrate Products */}
        <Card>
          <CardHeader>
            <CardTitle>Passo 3: Migrar Produtos</CardTitle>
            <CardDescription>
              Transferir produtos usando o mapeamento de IDs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => runAction("migrate_products")}
              disabled={loading !== null}
            >
              {loading === "migrate_products" && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Migrar Produtos
            </Button>

            {migrationResults.products && (
              <div className="mt-4">
                <div className="flex gap-4 mb-2">
                  <span className="text-sm">
                    Sucesso: {migrationResults.products.filter(r => r.status === "success").length}
                  </span>
                  <span className="text-sm">
                    Ignorados: {migrationResults.products.filter(r => r.status === "skipped").length}
                  </span>
                  <span className="text-sm">
                    Erros: {migrationResults.products.filter(r => r.status === "error").length}
                  </span>
                </div>
                <ScrollArea className="h-60 border rounded">
                  <div className="p-2 space-y-1">
                    {migrationResults.products.map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b">
                        <span>{result.name || result.id}</span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(result.status)}
                          {result.reason && <span className="text-xs text-muted-foreground">{result.reason}</span>}
                          {result.error && <span className="text-xs text-red-500">{result.error}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
