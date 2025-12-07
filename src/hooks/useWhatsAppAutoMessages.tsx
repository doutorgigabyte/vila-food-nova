import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppAutoMessage {
  id: string;
  establishment_id: string;
  event_type: string;
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_MESSAGES: Omit<WhatsAppAutoMessage, 'id' | 'establishment_id' | 'created_at' | 'updated_at'>[] = [
  {
    event_type: 'welcome',
    message_template: 'Olá! 👋 Bem-vindo(a)! Como posso ajudar você hoje?',
    is_active: true,
  },
  {
    event_type: 'business_hours',
    message_template: 'Estamos abertos! 🟢 Responderemos em breve.',
    is_active: true,
  },
  {
    event_type: 'outside_hours',
    message_template: 'Olá! 😊 No momento estamos fechados. Nosso horário de atendimento é de Segunda a Sábado, das 10h às 22h. Deixe sua mensagem que responderemos assim que possível!',
    is_active: true,
  },
  {
    event_type: 'order_confirmation',
    message_template: 'Pedido #{{order_number}} confirmado! ✅ Tempo estimado: {{estimated_time}} minutos.',
    is_active: true,
  },
  {
    event_type: 'order_ready',
    message_template: 'Seu pedido #{{order_number}} está pronto! 🎉',
    is_active: true,
  },
  {
    event_type: 'order_delivered',
    message_template: 'Pedido #{{order_number}} entregue! 📦 Obrigado pela preferência!',
    is_active: true,
  },
];

export function useWhatsAppAutoMessages(establishmentId: string | undefined) {
  const [messages, setMessages] = useState<WhatsAppAutoMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!establishmentId) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_auto_messages')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('event_type');

      if (error) throw error;

      if (!data || data.length === 0) {
        await createDefaultMessages();
      } else {
        setMessages(data as WhatsAppAutoMessage[]);
      }
    } catch (error) {
      console.error('Error fetching auto messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultMessages = async () => {
    if (!establishmentId) return;

    try {
      const messagesToInsert = DEFAULT_MESSAGES.map(msg => ({
        ...msg,
        establishment_id: establishmentId,
      }));

      const { data, error } = await supabase
        .from('whatsapp_auto_messages')
        .insert(messagesToInsert)
        .select();

      if (error) throw error;
      setMessages((data || []) as WhatsAppAutoMessage[]);
    } catch (error) {
      console.error('Error creating default messages:', error);
    }
  };

  const updateMessage = async (id: string, updates: Partial<WhatsAppAutoMessage>) => {
    try {
      const { error } = await supabase
        .from('whatsapp_auto_messages')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      ));

      toast({
        title: 'Salvo',
        description: 'Mensagem atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [establishmentId]);

  return {
    messages,
    isLoading,
    updateMessage,
    refetch: fetchMessages,
  };
}
