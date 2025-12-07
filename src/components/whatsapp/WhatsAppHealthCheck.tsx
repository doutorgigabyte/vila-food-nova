import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2,
  Wifi, Database, Bot, MessageSquare, Zap, Activity, Server
} from "lucide-react";

interface HealthStatus {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'checking';
  message: string;
  details?: string;
}

interface WhatsAppHealthCheckProps {
  establishmentId: string;
  instanceId?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
}

export function WhatsAppHealthCheck({ 
  establishmentId, 
  instanceId,
  evolutionApiUrl,
  evolutionApiKey 
}: WhatsAppHealthCheckProps) {
  const [checks, setChecks] = useState<HealthStatus[]>([]);
  const [running, setRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runHealthCheck = async () => {
    setRunning(true);
    const results: HealthStatus[] = [];

    // Check 1: Database connection
    results.push({ name: 'Banco de Dados', status: 'checking', message: 'Verificando...' });
    setChecks([...results]);
    
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('establishment_id', establishmentId)
        .limit(1);
      
      results[results.length - 1] = error 
        ? { name: 'Banco de Dados', status: 'error', message: 'Erro de conexão', details: error.message }
        : { name: 'Banco de Dados', status: 'ok', message: 'Conectado' };
    } catch (e) {
      results[results.length - 1] = { name: 'Banco de Dados', status: 'error', message: 'Falha na conexão' };
    }
    setChecks([...results]);

    // Check 2: WhatsApp Instance Configuration
    results.push({ name: 'Instância WhatsApp', status: 'checking', message: 'Verificando...' });
    setChecks([...results]);
    
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('establishment_id', establishmentId)
      .maybeSingle();

    if (!instance) {
      results[results.length - 1] = { name: 'Instância WhatsApp', status: 'warning', message: 'Não configurada' };
    } else if (instance.status === 'connected') {
      results[results.length - 1] = { name: 'Instância WhatsApp', status: 'ok', message: 'Conectada' };
    } else {
      results[results.length - 1] = { name: 'Instância WhatsApp', status: 'warning', message: `Status: ${instance.status || 'desconhecido'}` };
    }
    setChecks([...results]);

    // Check 3: Evolution API Connection
    results.push({ name: 'Evolution API', status: 'checking', message: 'Verificando...' });
    setChecks([...results]);
    
    if (evolutionApiUrl && evolutionApiKey && instanceId) {
      try {
        const response = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceId}`, {
          headers: { 'apikey': evolutionApiKey }
        });
        
        if (response.ok) {
          const data = await response.json();
          results[results.length - 1] = { 
            name: 'Evolution API', 
            status: data.state === 'open' ? 'ok' : 'warning',
            message: data.state === 'open' ? 'Conectado' : `Estado: ${data.state}`
          };
        } else {
          results[results.length - 1] = { name: 'Evolution API', status: 'error', message: 'Erro na API' };
        }
      } catch {
        results[results.length - 1] = { name: 'Evolution API', status: 'error', message: 'Não acessível' };
      }
    } else {
      results[results.length - 1] = { name: 'Evolution API', status: 'warning', message: 'Não configurada' };
    }
    setChecks([...results]);

    // Check 4: Keywords Configuration
    results.push({ name: 'Palavras-chave', status: 'checking', message: 'Verificando...' });
    setChecks([...results]);
    
    const { count: keywordsCount } = await supabase
      .from('whatsapp_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', establishmentId)
      .eq('is_active', true);

    results[results.length - 1] = keywordsCount && keywordsCount > 0
      ? { name: 'Palavras-chave', status: 'ok', message: `${keywordsCount} ativas` }
      : { name: 'Palavras-chave', status: 'warning', message: 'Nenhuma configurada' };
    setChecks([...results]);

    // Check 5: AI Agent (if enabled)
    results.push({ name: 'Agente IA', status: 'checking', message: 'Verificando...' });
    setChecks([...results]);
    
    if (instance?.ai_enabled) {
      results[results.length - 1] = instance.ai_prompt
        ? { name: 'Agente IA', status: 'ok', message: 'Configurado' }
        : { name: 'Agente IA', status: 'warning', message: 'Prompt não configurado' };
    } else {
      results[results.length - 1] = { name: 'Agente IA', status: 'warning', message: 'Desativado (Nível 1)' };
    }
    setChecks([...results]);

    // Check 6: Recent Activity
    results.push({ name: 'Atividade Recente', status: 'checking', message: 'Verificando...' });
    setChecks([...results]);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: messagesCount } = await supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', establishmentId)
      .gte('last_message_at', yesterday.toISOString());

    results[results.length - 1] = {
      name: 'Atividade Recente',
      status: messagesCount && messagesCount > 0 ? 'ok' : 'warning',
      message: messagesCount ? `${messagesCount} conversas (24h)` : 'Sem atividade'
    };
    setChecks([...results]);

    // Check 7: Edge Functions
    results.push({ name: 'Edge Functions', status: 'checking', message: 'Verificando...' });
    setChecks([...results]);
    
    try {
      const { error } = await supabase.functions.invoke('whatsapp-webhook', {
        method: 'POST',
        body: { test: true }
      });
      
      results[results.length - 1] = {
        name: 'Edge Functions',
        status: error ? 'warning' : 'ok',
        message: error ? 'Erro no teste' : 'Funcionando'
      };
    } catch {
      results[results.length - 1] = { name: 'Edge Functions', status: 'ok', message: 'Disponíveis' };
    }
    setChecks([...results]);

    setLastCheck(new Date());
    setRunning(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, [establishmentId]);

  const getStatusIcon = (status: HealthStatus['status']) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getCheckIcon = (name: string) => {
    switch (name) {
      case 'Banco de Dados': return <Database className="w-4 h-4" />;
      case 'Instância WhatsApp': return <MessageSquare className="w-4 h-4" />;
      case 'Evolution API': return <Server className="w-4 h-4" />;
      case 'Palavras-chave': return <Zap className="w-4 h-4" />;
      case 'Agente IA': return <Bot className="w-4 h-4" />;
      case 'Atividade Recente': return <Activity className="w-4 h-4" />;
      case 'Edge Functions': return <Wifi className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const okCount = checks.filter(c => c.status === 'ok').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const errorCount = checks.filter(c => c.status === 'error').length;
  const healthPercent = checks.length ? Math.round((okCount / checks.length) * 100) : 0;

  const overallStatus = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'ok';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Health Check do WhatsApp
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={overallStatus === 'ok' ? 'default' : overallStatus === 'warning' ? 'secondary' : 'destructive'}>
              {overallStatus === 'ok' ? 'Saudável' : overallStatus === 'warning' ? 'Atenção' : 'Problemas'}
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={runHealthCheck}
              disabled={running}
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Progress value={healthPercent} className="flex-1 h-2" />
          <span className="text-sm font-medium">{healthPercent}%</span>
        </div>

        <div className="grid gap-2">
          {checks.map((check, i) => (
            <div 
              key={i} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                check.status === 'ok' ? 'bg-green-500/5 border-green-500/20' :
                check.status === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                check.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                'bg-muted/50 border-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">{getCheckIcon(check.name)}</div>
                <div>
                  <p className="font-medium text-sm">{check.name}</p>
                  {check.details && (
                    <p className="text-xs text-muted-foreground">{check.details}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{check.message}</span>
                {getStatusIcon(check.status)}
              </div>
            </div>
          ))}
        </div>

        {lastCheck && (
          <p className="text-xs text-muted-foreground text-center">
            Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
          </p>
        )}

        <div className="flex justify-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-1 text-xs">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>{okCount} OK</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
            <span>{warningCount} Avisos</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <XCircle className="w-3 h-3 text-red-500" />
            <span>{errorCount} Erros</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
