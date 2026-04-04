import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EvolutionConfig {
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  establishmentId?: string;
}

interface EvolutionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useEvolutionAPI(config: EvolutionConfig) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAPI = useCallback(async <T = any>(
    action: string,
    params: Record<string, any> = {}
  ): Promise<EvolutionResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('evolution-api', {
        body: {
          action,
          ...config,
          ...params,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Unknown error');
      }

      return { success: true, data: data.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Create a new WhatsApp instance
  const createInstance = useCallback(async (instanceName: string, token?: string) => {
    const result = await callAPI('create_instance', { instanceName, token });
    if (result.success) {
      toast.success('Instância criada! Escaneie o QR Code.');
    } else {
      toast.error(result.error || 'Erro ao criar instância');
    }
    return result;
  }, [callAPI]);

  // Get QR code for connection
  const fetchQRCode = useCallback(async (instanceName: string) => {
    return await callAPI('fetch_qr', { instanceName });
  }, [callAPI]);

  // Check connection status
  const checkStatus = useCallback(async (instanceName: string) => {
    return await callAPI('check_status', { instanceName });
  }, [callAPI]);

  // List all instances
  const fetchInstances = useCallback(async () => {
    return await callAPI('fetch_instances');
  }, [callAPI]);

  // Disconnect instance
  const disconnect = useCallback(async (instanceName: string) => {
    const result = await callAPI('disconnect', { instanceName });
    if (result.success) {
      toast.success('WhatsApp desconectado');
    }
    return result;
  }, [callAPI]);

  // Configure webhook
  const setWebhook = useCallback(async (instanceName: string, webhookUrl: string) => {
    return await callAPI('set_webhook', { instanceName, webhookUrl });
  }, [callAPI]);

  // Send text message
  const sendText = useCallback(async (instanceName: string, phone: string, message: string) => {
    return await callAPI('send_text', { instanceName, phone, message });
  }, [callAPI]);

  // Send media (image, document, audio, video)
  const sendMedia = useCallback(async (
    instanceName: string,
    phone: string,
    mediatype: 'image' | 'document' | 'audio' | 'video',
    media: string,
    options?: {
      mimetype?: string;
      caption?: string;
      fileName?: string;
    }
  ) => {
    return await callAPI('send_media', { 
      instanceName, 
      phone, 
      mediatype, 
      media,
      ...options 
    });
  }, [callAPI]);

  // Get contacts
  const findContacts = useCallback(async (instanceName: string) => {
    return await callAPI('find_contacts', { instanceName });
  }, [callAPI]);

  // Get message history for a chat
  const findMessages = useCallback(async (instanceName: string, phone: string) => {
    // Convert phone to WhatsApp JID format
    const remoteJid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    return await callAPI('find_messages', { instanceName, remoteJid });
  }, [callAPI]);

  return {
    loading,
    error,
    createInstance,
    fetchQRCode,
    checkStatus,
    fetchInstances,
    disconnect,
    setWebhook,
    sendText,
    sendMedia,
    findContacts,
    findMessages,
  };
}
