import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, Bot, HandMetal, Play, Pause, RefreshCw, 
  MessageCircle, Clock, AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppSession {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  status: string;
  paused_at: string | null;
  paused_by: string | null;
  pause_reason: string | null;
  last_message_at: string | null;
  created_at: string;
  ai_active: boolean;
}

interface HumanTakeoverPanelProps {
  establishmentId: string;
  instanceId?: string;
}

export const HumanTakeoverPanel = ({ establishmentId, instanceId }: HumanTakeoverPanelProps) => {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveSessions();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('whatsapp_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_sessions',
          filter: `establishment_id=eq.${establishmentId}`,
        },
        (payload) => {
          const newSession = payload.new as WhatsAppSession;
          const oldSession = payload.old as WhatsAppSession;
          
          // Notify when AI status changes
          if (oldSession.ai_active !== newSession.ai_active) {
            if (!newSession.ai_active) {
              toast.info(
                `🔔 ${newSession.customer_name || newSession.customer_phone}: Atendimento humano ativado`,
                { description: newSession.pause_reason || 'Operador assumiu a conversa' }
              );
            } else {
              toast.success(
                `🤖 ${newSession.customer_name || newSession.customer_phone}: IA reativada`
              );
            }
          }
          
          fetchActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId]);

  const fetchActiveSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_sessions")
        .select("*")
        .eq("establishment_id", establishmentId)
        .in("status", ["active", "human_takeover"])
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setSessions((data || []) as WhatsAppSession[]);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHumanTakeover = async (session: WhatsAppSession) => {
    setToggling(session.id);
    try {
      const isCurrentlyPaused = !session.ai_active;
      
      const { error } = await supabase
        .from("whatsapp_sessions")
        .update({
          ai_active: isCurrentlyPaused,
          paused_at: isCurrentlyPaused ? null : new Date().toISOString(),
          pause_reason: isCurrentlyPaused ? null : "human_takeover",
        })
        .eq("id", session.id);

      if (error) throw error;

      toast.success(
        isCurrentlyPaused 
          ? "IA reativada para esta conversa" 
          : "Atendimento humano ativado"
      );
      
      fetchActiveSessions();
    } catch (error) {
      toast.error("Erro ao alterar status");
    } finally {
      setToggling(null);
    }
  };

  const humanTakeoverCount = sessions.filter(s => !s.ai_active).length;
  const activeAICount = sessions.filter(s => s.ai_active).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HandMetal className="w-5 h-5 text-orange-600" />
              Human Takeover
            </CardTitle>
            <CardDescription>
              Pause a IA e assuma o atendimento manualmente
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchActiveSessions}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-700">
              <Bot className="w-5 h-5" />
              <span className="text-2xl font-bold">{activeAICount}</span>
            </div>
            <p className="text-sm text-green-700/70">IA Ativa</p>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 text-orange-700">
              <User className="w-5 h-5" />
              <span className="text-2xl font-bold">{humanTakeoverCount}</span>
            </div>
            <p className="text-sm text-orange-700/70">Atendimento Humano</p>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1">
          <p className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Quando ativar o Human Takeover, a IA para de responder nessa conversa.
          </p>
        </div>

        {/* Sessions List */}
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mb-2" />
              <p>Nenhuma conversa ativa</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const isHumanTakeover = !session.ai_active;
                const isToggling = toggling === session.id;
                
                return (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isHumanTakeover 
                        ? 'bg-orange-500/5 border-orange-500/30' 
                        : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {session.customer_name || session.customer_phone}
                          </span>
                          {isHumanTakeover ? (
                            <Badge className="bg-orange-500 text-xs">
                              <User className="w-3 h-3 mr-1" />
                              Humano
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Bot className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.last_message_at 
                              ? formatDistanceToNow(new Date(session.last_message_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })
                              : 'Sem mensagens'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">
                          {isHumanTakeover ? 'Reativar IA' : 'Assumir'}
                        </Label>
                        <Switch
                          checked={isHumanTakeover}
                          onCheckedChange={() => toggleHumanTakeover(session)}
                          disabled={isToggling}
                        />
                      </div>
                    </div>
                    
                    {isHumanTakeover && session.paused_at && (
                      <p className="text-xs text-orange-600 mt-2">
                        Pausado há {formatDistanceToNow(new Date(session.paused_at), { locale: ptBR })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
