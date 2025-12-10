import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupportChat, SupportConversation, SupportMessage } from '@/hooks/useSupportChat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageCircle, 
  Send, 
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Bot,
  Store,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportInboxProps {
  establishmentId: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  open: { label: 'Aberta', icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-500' },
  waiting_customer: { label: 'Aguardando Cliente', icon: <Clock className="w-3 h-3" />, color: 'bg-blue-500' },
  waiting_establishment: { label: 'Aguardando Você', icon: <AlertCircle className="w-3 h-3" />, color: 'bg-red-500' },
  resolved: { label: 'Resolvida', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-500' },
  cancelled: { label: 'Cancelada', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-gray-500' },
};

const SupportInbox = ({ establishmentId }: SupportInboxProps) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const {
    conversations,
    loading,
  } = useSupportChat({
    establishmentId,
    role: 'establishment',
  });

  const filteredConversations = conversations.filter(c => {
    if (filter === 'all') return c.status !== 'resolved' && c.status !== 'cancelled';
    if (filter === 'pending') return c.status === 'waiting_establishment';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <ConversationView
        conversationId={selectedConversation}
        establishmentId={establishmentId}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Aguardando
          {conversations.filter(c => c.status === 'waiting_establishment').length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {conversations.filter(c => c.status === 'waiting_establishment').length}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === 'resolved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('resolved')}
        >
          Resolvidas
        </Button>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">Nenhuma conversa</h3>
            <p className="text-sm text-muted-foreground">
              As conversas de suporte aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              onClick={() => setSelectedConversation(conversation.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ConversationCard = ({
  conversation,
  onClick,
}: {
  conversation: SupportConversation;
  onClick: () => void;
}) => {
  const status = statusConfig[conversation.status] || statusConfig.open;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium truncate">
                {conversation.customer_name || 'Cliente'}
              </h4>
              <Badge variant="secondary" className="gap-1 text-xs">
                <div className={cn('w-2 h-2 rounded-full', status.color)} />
                {status.label}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground truncate">
              {conversation.subject || 'Sem assunto'}
            </p>
            
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {conversation.order && (
                <span>Pedido #{conversation.order.order_number}</span>
              )}
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(conversation.last_message_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ConversationView = ({
  conversationId,
  establishmentId,
  onBack,
}: {
  conversationId: string;
  establishmentId: string;
  onBack: () => void;
}) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sending,
    sendMessage,
    resolveConversation,
  } = useSupportChat({
    conversationId,
    establishmentId,
    role: 'establishment',
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="border-b py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <CardTitle className="text-base">Conversa de Suporte</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto"
            onClick={resolveConversation}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Encerrar
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageBubbleEstablishment key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua resposta..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const MessageBubbleEstablishment = ({ message }: { message: SupportMessage }) => {
  const isEstablishment = message.sender_type === 'establishment';
  const isBot = message.sender_type === 'bot' || message.sender_type === 'system';

  return (
    <div className={cn('flex gap-2', isEstablishment ? 'justify-end' : 'justify-start')}>
      {!isEstablishment && (
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          isBot ? 'bg-blue-100 text-blue-600' : 'bg-muted'
        )}>
          {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
      )}
      
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-2',
        isEstablishment 
          ? 'bg-primary text-primary-foreground rounded-br-none'
          : isBot
            ? 'bg-blue-100 text-blue-900 rounded-bl-none'
            : 'bg-muted rounded-bl-none'
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          'text-[10px] mt-1',
          isEstablishment ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {formatDistanceToNow(new Date(message.created_at), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </p>
      </div>
      
      {isEstablishment && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Store className="w-4 h-4 text-primary" />
        </div>
      )}
    </div>
  );
};

export default SupportInbox;
