import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, Zap, Users, TrendingUp, Clock, Bot,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";

interface RealTimeStats {
  messagesTotal: number;
  messagesToday: number;
  messagesYesterday: number;
  ordersViaWhatsApp: number;
  activeConversations: number;
  avgResponseTime: number;
  aiResponses: number;
  humanEscalations: number;
  conversionRate: number;
}

interface WhatsAppRealTimeStatsProps {
  establishmentId: string;
}

export function WhatsAppRealTimeStats({ establishmentId }: WhatsAppRealTimeStatsProps) {
  const [stats, setStats] = useState<RealTimeStats>({
    messagesTotal: 0,
    messagesToday: 0,
    messagesYesterday: 0,
    ordersViaWhatsApp: 0,
    activeConversations: 0,
    avgResponseTime: 0,
    aiResponses: 0,
    humanEscalations: 0,
    conversionRate: 0
  });

  const fetchStats = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Messages today
    const { count: todayCount } = await supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', establishmentId)
      .gte('last_message_at', today.toISOString());

    // Messages yesterday
    const { count: yesterdayCount } = await supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', establishmentId)
      .gte('last_message_at', yesterday.toISOString())
      .lt('last_message_at', today.toISOString());

    // Total messages
    const { count: totalCount } = await supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', establishmentId);

    // Active conversations (last 30 minutes)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const { count: activeCount } = await supabase
      .from('whatsapp_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', establishmentId)
      .eq('status', 'active')
      .gte('last_interaction', thirtyMinutesAgo.toISOString());

    // Orders via WhatsApp
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', establishmentId)
      .eq('order_source', 'whatsapp')
      .gte('created_at', today.toISOString());

    // Conversation metrics
    const { data: sessions } = await supabase
      .from('whatsapp_sessions')
      .select('status')
      .eq('establishment_id', establishmentId)
      .gte('created_at', today.toISOString());

    const totalSessions = sessions?.length || 1;
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
    const conversionRate = ordersCount ? Math.round((ordersCount / totalSessions) * 100) : 0;

    setStats({
      messagesTotal: totalCount || 0,
      messagesToday: todayCount || 0,
      messagesYesterday: yesterdayCount || 0,
      ordersViaWhatsApp: ordersCount || 0,
      activeConversations: activeCount || 0,
      avgResponseTime: 2.5, // Placeholder - would need to calculate from message timestamps
      aiResponses: completedSessions,
      humanEscalations: totalSessions - completedSessions,
      conversionRate
    });
  };

  useEffect(() => {
    fetchStats();

    // Real-time subscription
    const channel = supabase
      .channel('whatsapp-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: `establishment_id=eq.${establishmentId}`
        },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_sessions',
          filter: `establishment_id=eq.${establishmentId}`
        },
        () => fetchStats()
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [establishmentId]);

  const messagesTrend = stats.messagesToday - stats.messagesYesterday;
  const messagesTrendPercent = stats.messagesYesterday 
    ? Math.round((messagesTrend / stats.messagesYesterday) * 100)
    : 0;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Mensagens Hoje</p>
              <p className="text-2xl font-bold">{stats.messagesToday}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {messagesTrend >= 0 ? (
              <ArrowUpRight className="w-3 h-3 text-green-500" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-red-500" />
            )}
            <span className={messagesTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
              {messagesTrend >= 0 ? '+' : ''}{messagesTrendPercent}%
            </span>
            <span className="text-muted-foreground">vs ontem</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pedidos via WhatsApp</p>
              <p className="text-2xl font-bold">{stats.ordersViaWhatsApp}</p>
            </div>
            <div className="p-2 bg-green-500/10 rounded-full">
              <Zap className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-green-500">{stats.conversionRate}%</span>
            <span className="text-muted-foreground">conversão</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Conversas Ativas</p>
              <p className="text-2xl font-bold">{stats.activeConversations}</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">últimos 30 min</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Respostas IA</p>
              <p className="text-2xl font-bold">{stats.aiResponses}</p>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-full">
              <Bot className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <Badge variant="secondary" className="text-xs">
              {stats.humanEscalations} escalados
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
