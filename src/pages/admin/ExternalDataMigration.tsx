import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Database, CheckCircle, XCircle, AlertCircle, Trash2, RefreshCw, Zap, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ExternalDataMigration() {
  const [loading, setLoading] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [imageResult, setImageResult] = useState<any>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-external-data", {
        body: { action },
      });

      if (error) throw error;

      if (action === "check_external") {
        setCheckResult(data);
      } else if (action === "migrate_by_slug") {
        setMigrationResult(data);
        if (data.success) {
          toast.success(`Migração concluída! ${data.categories?.success || 0} categorias e ${data.products?.success || 0} produtos migrados.`);
        }
      } else if (action === "cleanup_external" || action === "confirm_cleanup") {
        setCleanupResult(data);
        if (action === "confirm_cleanup" && data.success) {
          toast.success("Tabelas legadas limpas com sucesso!");
        }
      } else if (action === "sync_images") {
        setImageResult(data);
        if (data.success) {
          toast.success(`Imagens sincronizadas! ${data.products?.updated || 0} produtos atualizados.`);
        }
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro na operação");
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Sucesso</Badge>;
      case "exists":
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Existe</Badge>;
      case "skipped":
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Ignorado</Badge>;
      case "error":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Migração de Dados Externos">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Migração de Dados Externos</h1>
          <p className="text-muted-foreground">
            Migrar dados do banco legado para o banco atual
          </p>
        </div>

        {/* Passo 1: Verificar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Passo 1: Verificar Dados
            </CardTitle>
            <CardDescription>
              Analisa os dados do banco legado e verifica o mapeamento com o banco atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleAction("check_external")}
              disabled={loading !== null}
            >
              {loading === "check_external" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" />Verificar Dados</>
              )}
            </Button>

            {checkResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{checkResult.summary?.estabelecimentos_legado || 0}</div>
                    <div className="text-sm text-muted-foreground">Est. Legado</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{checkResult.summary?.estabelecimentos_atual || 0}</div>
                    <div className="text-sm text-muted-foreground">Est. Atual</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{checkResult.summary?.mapeados || 0}</div>
                    <div className="text-sm text-muted-foreground">Mapeados</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{checkResult.summary?.total_categorias || 0}</div>
                    <div className="text-sm text-muted-foreground">Categorias</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{checkResult.summary?.total_produtos || 0}</div>
                    <div className="text-sm text-muted-foreground">Produtos</div>
                  </div>
                </div>

                {checkResult.details && (
                  <ScrollArea className="h-64 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Nome</th>
                          <th className="text-left p-2">Slug</th>
                          <th className="text-center p-2">Categorias</th>
                          <th className="text-center p-2">Produtos</th>
                          <th className="text-center p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkResult.details.map((item: any) => (
                          <tr key={item.legacy_id} className="border-t">
                            <td className="p-2">{item.nome}</td>
                            <td className="p-2 font-mono text-xs">{item.slug}</td>
                            <td className="p-2 text-center">{item.categorias}</td>
                            <td className="p-2 text-center">{item.produtos}</td>
                            <td className="p-2 text-center">
                              {item.mapeado ? (
                                <Badge className="bg-green-500">Mapeado</Badge>
                              ) : (
                                <Badge variant="destructive">Não mapeado</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Passo 2: Migrar */}
        <Card className="border-green-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Zap className="w-5 h-5" />
              Passo 2: Migrar Dados
            </CardTitle>
            <CardDescription>
              Migra categorias e produtos dos estabelecimentos mapeados por slug
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                A migração só funciona para estabelecimentos com slug correspondente no banco atual.
                Itens já existentes serão ignorados automaticamente.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => handleAction("migrate_by_slug")}
              disabled={loading !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading === "migrate_by_slug" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Migrando...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" />Migrar Tudo por Slug</>
              )}
            </Button>

            {migrationResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{migrationResult.establishment_mappings?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Est. Mapeados</div>
                  </div>
                  <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{migrationResult.categories?.success || 0}</div>
                    <div className="text-sm text-muted-foreground">Cat. Migradas</div>
                  </div>
                  <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{migrationResult.products?.success || 0}</div>
                    <div className="text-sm text-muted-foreground">Prod. Migrados</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{migrationResult.categories?.exists || 0} / {migrationResult.products?.exists || 0}</div>
                    <div className="text-sm text-muted-foreground">Já Existentes</div>
                  </div>
                </div>

                {migrationResult.establishment_mappings?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Estabelecimentos Mapeados:</h4>
                    <div className="flex flex-wrap gap-2">
                      {migrationResult.establishment_mappings.map((est: any) => (
                        <Badge key={est.new_id} variant="outline">{est.nome}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {migrationResult.categories?.results && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Categorias ({migrationResult.categories.total})</h4>
                      <ScrollArea className="h-48 border rounded-lg">
                        <div className="p-2 space-y-1">
                          {migrationResult.categories.results.slice(0, 100).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="truncate max-w-[60%]">{item.name}</span>
                              {getStatusBadge(item.status)}
                            </div>
                          ))}
                          {migrationResult.categories.results.length > 100 && (
                            <div className="text-muted-foreground text-center text-xs">
                              ... e mais {migrationResult.categories.results.length - 100} itens
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {migrationResult.products?.results && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Produtos ({migrationResult.products.total})</h4>
                      <ScrollArea className="h-48 border rounded-lg">
                        <div className="p-2 space-y-1">
                          {migrationResult.products.results.slice(0, 100).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="truncate max-w-[60%]">{item.name}</span>
                              {getStatusBadge(item.status)}
                            </div>
                          ))}
                          {migrationResult.products.results.length > 100 && (
                            <div className="text-muted-foreground text-center text-xs">
                              ... e mais {migrationResult.products.results.length - 100} itens
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Passo 3: Sincronizar Imagens */}
        <Card className="border-blue-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Image className="w-5 h-5" />
              Passo 3: Sincronizar Imagens
            </CardTitle>
            <CardDescription>
              Atualiza as URLs das imagens para o CloudFront legado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sobre as imagens</AlertTitle>
              <AlertDescription>
                As imagens migradas usam caminhos relativos. Este passo adiciona o prefixo do CloudFront legado
                (https://d2fhl3f70zfvod.cloudfront.net) para que as imagens sejam exibidas corretamente.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => handleAction("sync_images")}
              disabled={loading !== null}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading === "sync_images" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sincronizando...</>
              ) : (
                <><Image className="w-4 h-4 mr-2" />Sincronizar Imagens</>
              )}
            </Button>

            {imageResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{imageResult.products?.total || 0}</div>
                    <div className="text-sm text-muted-foreground">Produtos Analisados</div>
                  </div>
                  <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{imageResult.products?.updated || 0}</div>
                    <div className="text-sm text-muted-foreground">Atualizados</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{imageResult.categories?.total || 0}</div>
                    <div className="text-sm text-muted-foreground">Categorias</div>
                  </div>
                  <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{imageResult.categories?.updated || 0}</div>
                    <div className="text-sm text-muted-foreground">Cat. Atualizadas</div>
                  </div>
                </div>

                {imageResult.sample_results?.length > 0 && (
                  <ScrollArea className="h-48 border rounded-lg">
                    <div className="p-2 space-y-1">
                      {imageResult.sample_results.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[40%]">{item.name}</span>
                          <span className="truncate max-w-[40%] font-mono text-xs text-muted-foreground">
                            {item.new_url?.split('/').slice(-1)[0] || ''}
                          </span>
                          {getStatusBadge(item.status === "updated" ? "success" : item.status)}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Passo 4: Limpeza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Passo 4: Limpeza (Opcional)
            </CardTitle>
            <CardDescription>
              Remove as tabelas legadas do banco externo após a migração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleAction("cleanup_external")}
                disabled={loading !== null}
              >
                {loading === "cleanup_external" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" />Verificar Limpeza</>
                )}
              </Button>

              {cleanupResult?.tables_to_cleanup && (
                <Button
                  variant="destructive"
                  onClick={() => handleAction("confirm_cleanup")}
                  disabled={loading !== null}
                >
                  {loading === "confirm_cleanup" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Limpando...</>
                  ) : (
                    <><Trash2 className="w-4 h-4 mr-2" />Confirmar Limpeza</>
                  )}
                </Button>
              )}
            </div>

            {cleanupResult && (
              <div className="p-4 bg-muted rounded-lg">
                {cleanupResult.tables_to_cleanup ? (
                  <div className="space-y-2">
                    <p className="font-medium">Tabelas a serem limpas:</p>
                    {cleanupResult.tables_to_cleanup.map((t: any) => (
                      <div key={t.table} className="flex justify-between">
                        <span className="font-mono">{t.table}</span>
                        <span>{t.records} registros</span>
                      </div>
                    ))}
                  </div>
                ) : cleanupResult.results ? (
                  <div className="space-y-2">
                    <p className="font-medium text-green-600">Limpeza concluída:</p>
                    {cleanupResult.results.map((r: any) => (
                      <div key={r.table} className="flex justify-between items-center">
                        <span className="font-mono">{r.table}</span>
                        {r.deleted ? (
                          <Badge className="bg-green-500">Limpo</Badge>
                        ) : (
                          <Badge variant="destructive">{r.error}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
