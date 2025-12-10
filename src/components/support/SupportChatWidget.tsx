import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupportChat, SupportMessage } from '@/hooks/useSupportChat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Store,
  Minimize2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportChatWidgetProps {
  establishmentId: string;
  establishmentName: string;
  establishmentLogo?: string;
  orderId?: string;
  orderNumber?: number;
}

const SupportChatWidget = ({
  establishmentId,
  establishmentName,
  establishmentLogo,
  orderId,
  orderNumber,
}: SupportChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sending,
    sendMessage,
    createConversation,
  } = useSupportChat({
    conversationId: conversationId || undefined,
    role: 'customer',
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleOpen = async () => {
    setIsOpen(true);
    if (!conversationId) {
      const newId = await createConversation(
        establishmentId,
        orderId,
        orderNumber ? `Pedido #${orderNumber}` : 'Dúvida geral'
      );
      if (newId) {
        setConversationId(newId);
        // Send initial bot message
        setTimeout(() => {
          // This would be handled by the chatbot system
        }, 500);
      }
    }
  };

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

  const getSenderIcon = (type: string) => {
    switch (type) {
      case 'bot':
        return <Bot className="w-4 h-4" />;
      case 'establishment':
        return <Store className="w-4 h-4" />;
      case 'system':
        return <Bot className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={handleOpen}
            className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-md h-[500px] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-primary text-primary-foreground">
              <Avatar className="w-10 h-10 border-2 border-primary-foreground/20">
                <AvatarImage src={establishmentLogo} />
                <AvatarFallback className="bg-primary-foreground/20">
                  {establishmentName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{establishmentName}</h3>
                <p className="text-xs text-primary-foreground/70">Suporte</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <Minimize2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Olá! Como posso ajudar?
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Digite sua mensagem abaixo
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {sending && (
                  <div className="flex justify-end">
                    <div className="bg-primary/10 rounded-lg px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const MessageBubble = ({ message }: { message: SupportMessage }) => {
  const isCustomer = message.sender_type === 'customer';
  const isBot = message.sender_type === 'bot' || message.sender_type === 'system';

  return (
    <div className={cn('flex gap-2', isCustomer ? 'justify-end' : 'justify-start')}>
      {!isCustomer && (
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          isBot ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'
        )}>
          {isBot ? <Bot className="w-4 h-4" /> : <Store className="w-4 h-4" />}
        </div>
      )}
      
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-2',
        isCustomer 
          ? 'bg-primary text-primary-foreground rounded-br-none'
          : isBot
            ? 'bg-blue-100 text-blue-900 rounded-bl-none'
            : 'bg-muted rounded-bl-none'
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          'text-[10px] mt-1',
          isCustomer ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {formatDistanceToNow(new Date(message.created_at), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </p>
      </div>
    </div>
  );
};

export default SupportChatWidget;
