import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, Search, User, Clock, ChevronRight, 
  ShoppingCart, CheckCircle, XCircle, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
  messages_count: number;
  has_order: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  is_from_bot: boolean;
  message_type: string;
  created_at: string;
}

interface ConversationHistoryProps {
  establishmentId: string | null;
}

export function ConversationHistory({ establishmentId }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (establishmentId) fetchConversations();
  }, [establishmentId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data: sessions } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (sessions) {
        const conversationsData: Conversation[] = sessions.map((s: any) => ({
          id: s.id,
          customer_phone: s.customer_phone,
          customer_name: s.customer_name,
          status: s.status,
          last_message_at: s.last_message_at || s.created_at,
          created_at: s.created_at,
          messages_count: 0,
          has_order: false,
        }));
        setConversations(conversationsData);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('session_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages((data as Message[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };

  const filteredConversations = conversations.filter(conv => 
    conv.customer_phone.includes(search) || 
    conv.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatPhone = (phone: string) => {
    if (phone.length === 13) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'completed':
        return <Badge variant="secondary">Finalizada</Badge>;
      case 'abandoned':
        return <Badge variant="destructive">Abandonada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Conversas ({conversations.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por telefone ou nome..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {conv.customer_name || formatPhone(conv.customer_phone)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPhone(conv.customer_phone)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {getStatusBadge(conv.status)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(conv.last_message_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages View */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3 border-b">
          {selectedConversation ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {selectedConversation.customer_name || 'Cliente'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPhone(selectedConversation.customer_phone)}
                  </p>
                </div>
              </div>
              {getStatusBadge(selectedConversation.status)}
            </div>
          ) : (
            <CardTitle className="text-base text-muted-foreground">
              Selecione uma conversa
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] p-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !selectedConversation ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                <p>Selecione uma conversa para ver as mensagens</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                <p>Nenhuma mensagem nesta conversa</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_from_bot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.is_from_bot
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.is_from_bot ? 'text-muted-foreground' : 'text-primary-foreground/70'
                      }`}>
                        {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
