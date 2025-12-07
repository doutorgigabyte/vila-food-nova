import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppKeyword {
  id: string;
  establishment_id: string;
  keywords: string[];
  response_text: string;
  response_link: string | null;
  category: string;
  is_active: boolean;
  send_menu_link: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_KEYWORDS: Omit<WhatsAppKeyword, 'id' | 'establishment_id' | 'created_at' | 'updated_at'>[] = [
  {
    keywords: ['cardapio', 'menu', 'cardápio'],
    response_text: 'Confira nosso cardápio completo! 📋',
    response_link: null,
    category: 'menu',
    is_active: true,
    send_menu_link: true,
    sort_order: 1,
  },
  {
    keywords: ['pedido', 'pedir', 'quero'],
    response_text: 'Para fazer seu pedido, acesse nosso cardápio digital: 🛒',
    response_link: null,
    category: 'order',
    is_active: true,
    send_menu_link: true,
    sort_order: 2,
  },
  {
    keywords: ['horario', 'horário', 'funcionamento', 'aberto'],
    response_text: 'Nosso horário de funcionamento é de Segunda a Sábado, das 10h às 22h. 🕐',
    response_link: null,
    category: 'hours',
    is_active: true,
    send_menu_link: false,
    sort_order: 3,
  },
  {
    keywords: ['endereco', 'endereço', 'localização', 'localizacao', 'onde fica'],
    response_text: 'Estamos localizados na Rua Principal, 123 - Centro. 📍',
    response_link: null,
    category: 'address',
    is_active: true,
    send_menu_link: false,
    sort_order: 4,
  },
  {
    keywords: ['entrega', 'delivery', 'taxa', 'frete'],
    response_text: 'Fazemos entregas! A taxa varia de acordo com a distância. Consulte no app! 🛵',
    response_link: null,
    category: 'delivery',
    is_active: true,
    send_menu_link: true,
    sort_order: 5,
  },
  {
    keywords: ['atendente', 'humano', 'pessoa', 'ajuda'],
    response_text: 'Aguarde, um atendente irá responder em breve! 👋',
    response_link: null,
    category: 'human',
    is_active: true,
    send_menu_link: false,
    sort_order: 6,
  },
];

export function useWhatsAppKeywords(establishmentId: string | undefined) {
  const [keywords, setKeywords] = useState<WhatsAppKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchKeywords = async () => {
    if (!establishmentId) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_keywords')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('sort_order');

      if (error) throw error;

      if (!data || data.length === 0) {
        await createDefaultKeywords();
      } else {
        setKeywords(data as WhatsAppKeyword[]);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultKeywords = async () => {
    if (!establishmentId) return;

    try {
      const keywordsToInsert = DEFAULT_KEYWORDS.map(kw => ({
        ...kw,
        establishment_id: establishmentId,
      }));

      const { data, error } = await supabase
        .from('whatsapp_keywords')
        .insert(keywordsToInsert)
        .select();

      if (error) throw error;
      setKeywords((data || []) as WhatsAppKeyword[]);
    } catch (error) {
      console.error('Error creating default keywords:', error);
    }
  };

  const updateKeyword = async (id: string, updates: Partial<WhatsAppKeyword>) => {
    try {
      const { error } = await supabase
        .from('whatsapp_keywords')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setKeywords(prev => prev.map(kw => 
        kw.id === id ? { ...kw, ...updates } : kw
      ));

      toast({
        title: 'Salvo',
        description: 'Palavra-chave atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Error updating keyword:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    }
  };

  const addKeyword = async (keyword: Omit<WhatsAppKeyword, 'id' | 'establishment_id' | 'created_at' | 'updated_at'>) => {
    if (!establishmentId) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_keywords')
        .insert({
          ...keyword,
          establishment_id: establishmentId,
        })
        .select()
        .single();

      if (error) throw error;
      setKeywords(prev => [...prev, data as WhatsAppKeyword]);

      toast({
        title: 'Adicionado',
        description: 'Nova palavra-chave criada.',
      });
    } catch (error) {
      console.error('Error adding keyword:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a palavra-chave.',
        variant: 'destructive',
      });
    }
  };

  const deleteKeyword = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_keywords')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setKeywords(prev => prev.filter(kw => kw.id !== id));

      toast({
        title: 'Removido',
        description: 'Palavra-chave excluída.',
      });
    } catch (error) {
      console.error('Error deleting keyword:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a palavra-chave.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, [establishmentId]);

  return {
    keywords,
    isLoading,
    updateKeyword,
    addKeyword,
    deleteKeyword,
    refetch: fetchKeywords,
  };
}
