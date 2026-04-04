import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupportConversation {
  id: string;
  order_id?: string;
  establishment_id: string;
  customer_id?: string;
  customer_phone?: string;
  customer_name?: string;
  status: string;
  subject?: string;
  priority: string;
  last_message_at: string;
  created_at: string;
  establishment?: {
    name: string;
    logo_url?: string;
  };
  order?: {
    order_number: number;
  };
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'establishment' | 'system' | 'bot';
  sender_id?: string;
  sender_name?: string;
  content: string;
  message_type: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
}

interface UseSupportChatOptions {
  conversationId?: string;
  establishmentId?: string;
  role: 'customer' | 'establishment';
}

export function useSupportChat({ conversationId, establishmentId, role }: UseSupportChatOptions) {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!establishmentId && role === 'establishment') return;

    try {
      let query = supabase
        .from('support_conversations')
        .select(`
          *,
          establishment:establishments(name, logo_url),
          order:orders(order_number)
        `)
        .order('last_message_at', { ascending: false });

      if (role === 'establishment' && establishmentId) {
        query = query.eq('establishment_id', establishmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [establishmentId, role]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Cast sender_type to the correct type
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'customer' | 'establishment' | 'system' | 'bot'
      }));
      
      setMessages(typedMessages);
      if (role === 'establishment') {
        await supabase
          .from('support_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('sender_type', 'customer')
          .eq('is_read', false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [conversationId, role]);

  // Send a message
  const sendMessage = async (content: string, messageType: string = 'text') => {
    if (!conversationId || !content.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: role,
          sender_id: user?.id,
          sender_name: role === 'establishment' ? 'Estabelecimento' : 'Cliente',
          content: content.trim(),
          message_type: messageType,
        });

      if (error) throw error;
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem');
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Create a new conversation
  const createConversation = async (
    estId: string,
    orderId?: string,
    subject?: string
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('support_conversations')
        .insert({
          establishment_id: estId,
          order_id: orderId,
          customer_id: user?.id,
          subject,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error: any) {
      toast.error('Erro ao criar conversa');
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // Resolve conversation
  const resolveConversation = async () => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('support_conversations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', conversationId);

      if (error) throw error;
      toast.success('Conversa encerrada');
      fetchConversations();
    } catch (error: any) {
      toast.error('Erro ao encerrar conversa');
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    channelRef.current = supabase
      .channel(`support-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SupportMessage]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    conversations,
    messages,
    loading,
    sending,
    sendMessage,
    createConversation,
    resolveConversation,
    refetch: fetchConversations,
  };
}
