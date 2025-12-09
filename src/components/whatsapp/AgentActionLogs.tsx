import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, RefreshCw, Check, X, Clock, 
  ShoppingCart, CreditCard, MapPin, Image, Search
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgentAction {
  id: string;
  session_id: string;
  action_type: string;
  action_data: Record<string, unknown>;
  result: Record<string, unknown>;
  success: boolean;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

interface AgentActionLogsProps {
  establishmentId: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  search_products: <Search className="w-4 h-4" />,
  add_to_cart: <ShoppingCart className="w-4 h-4" />,
  create_order: <CreditCard className="w-4 h-4" />,
  validate_address: <MapPin className="w-4 h-4" />,
  send_product_photo: <Image className="w-4 h-4" />,
  human_takeover: <Activity className="w-4 h-4" />,
};

const ACTION_LABELS: Record<string, string> = {
  search_products: "Buscar Produtos",
  add_to_cart: "Adicionar ao Carrinho",
  create_order: "Criar Pedido",
  validate_address: "Validar Endereço",
  send_product_photo: "Enviar Foto",
  human_takeover: "Human Takeover",
};

export const AgentActionLogs = ({ establishmentId }: AgentActionLogsProps) => {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
  }, [establishmentId]);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agent_action_logs")
        .select("*")
        .eq("establishment_id", establishmentId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setActions((data || []) as AgentAction[]);
    } catch (error) {
      console.error("Error fetching actions:", error);
    } finally {
      setLoading(false);
    }
  };

  const successCount = actions.filter(a => a.success).length;
  const errorCount = actions.filter(a => !a.success).length;
  const avgTime = actions.length > 0 
    ? Math.round(actions.reduce((sum, a) => sum + (a.execution_time_ms || 0), 0) / actions.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Logs do Agente IA
            </CardTitle>
            <CardDescription>
              Histórico de ações executadas pelo agente
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchActions}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-green-700">
              <Check className="w-4 h-4" />
              <span className="text-xl font-bold">{successCount}</span>
            </div>
            <p className="text-xs text-green-700/70">Sucesso</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-red-700">
              <X className="w-4 h-4" />
              <span className="text-xl font-bold">{errorCount}</span>
            </div>
            <p className="text-xs text-red-700/70">Erros</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-700">
              <Clock className="w-4 h-4" />
              <span className="text-xl font-bold">{avgTime}ms</span>
            </div>
            <p className="text-xs text-blue-700/70">Tempo Médio</p>
          </div>
        </div>

        {/* Actions List */}
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="w-8 h-8 mb-2" />
              <p>Nenhuma ação registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    !action.success ? 'border-red-500/30 bg-red-500/5' : 'bg-card'
                  }`}
                  onClick={() => setExpandedId(expandedId === action.id ? null : action.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={action.success ? 'text-green-600' : 'text-red-600'}>
                        {ACTION_ICONS[action.action_type] || <Activity className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-sm">
                        {ACTION_LABELS[action.action_type] || action.action_type}
                      </span>
                      {action.success ? (
                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Erro
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {action.execution_time_ms && (
                        <span>{action.execution_time_ms}ms</span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(action.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {expandedId === action.id && (
                    <div className="mt-3 pt-3 border-t text-xs space-y-2">
                      <div>
                        <span className="text-muted-foreground">Session ID:</span>{' '}
                        <code className="bg-muted px-1 rounded">{action.session_id}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timestamp:</span>{' '}
                        {format(new Date(action.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </div>
                      {action.action_data && Object.keys(action.action_data).length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Dados:</span>
                          <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(action.action_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {action.error_message && (
                        <div className="text-red-600">
                          <span className="font-medium">Erro:</span> {action.error_message}
                        </div>
                      )}
                      {action.result && Object.keys(action.result).length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Resultado:</span>
                          <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(action.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
