import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IFoodConnectionStatus {
  connected: boolean;
  status: 'not_connected' | 'pending' | 'connected' | 'expired' | 'revoked';
  merchantId: string | null;
  lastSyncAt: string | null;
  tokenExpiresAt: string | null;
}

interface UserCodeResponse {
  userCode: string;
  verificationUrl: string;
  verificationUrlComplete: string;
  expiresIn: number;
}

interface ImportStats {
  categoriesImported: number;
  categoriesUpdated: number;
  productsImported: number;
  productsUpdated: number;
  errors: string[];
}

export function useIFoodIntegration(establishmentId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<IFoodConnectionStatus | null>(null);
  const [userCodeData, setUserCodeData] = useState<UserCodeResponse | null>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);

  const getStatus = useCallback(async () => {
    if (!establishmentId) return;
    
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('ifood-oauth', {
        body: {
          action: 'get_status',
          establishmentId,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        setConnectionStatus({
          connected: data.connected,
          status: data.status,
          merchantId: data.merchantId,
          lastSyncAt: data.lastSyncAt,
          tokenExpiresAt: data.tokenExpiresAt,
        });
      }
    } catch (err: any) {
      console.error('Error getting iFood status:', err);
      setConnectionStatus({
        connected: false,
        status: 'not_connected',
        merchantId: null,
        lastSyncAt: null,
        tokenExpiresAt: null,
      });
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  const generateUserCode = useCallback(async () => {
    if (!establishmentId) return;
    
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('ifood-oauth', {
        body: {
          action: 'generate_user_code',
          establishmentId,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        setUserCodeData({
          userCode: data.userCode,
          verificationUrl: data.verificationUrl,
          verificationUrlComplete: data.verificationUrlComplete,
          expiresIn: data.expiresIn,
        });
        return data;
      } else {
        throw new Error(data.error || 'Failed to generate user code');
      }
    } catch (err: any) {
      console.error('Error generating user code:', err);
      toast.error(err.message || 'Erro ao gerar código de autorização');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  const exchangeToken = useCallback(async (authorizationCode: string, merchantId?: string) => {
    if (!establishmentId) return;
    
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('ifood-oauth', {
        body: {
          action: 'exchange_token',
          establishmentId,
          authorizationCode,
          merchantId,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('iFood conectado com sucesso!');
        setUserCodeData(null);
        await getStatus();
        return data;
      } else {
        throw new Error(data.error || 'Failed to exchange token');
      }
    } catch (err: any) {
      console.error('Error exchanging token:', err);
      toast.error(err.message || 'Erro ao conectar iFood');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [establishmentId, getStatus]);

  const disconnect = useCallback(async () => {
    if (!establishmentId) return;
    
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('ifood-oauth', {
        body: {
          action: 'disconnect',
          establishmentId,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('iFood desconectado');
        await getStatus();
      }
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      toast.error(err.message || 'Erro ao desconectar');
    } finally {
      setLoading(false);
    }
  }, [establishmentId, getStatus]);

  const importCatalog = useCallback(async (merchantId: string) => {
    if (!establishmentId) return;
    
    setImporting(true);
    setImportStats(null);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('ifood-import-catalog', {
        body: {
          establishmentId,
          merchantId,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message);
        setImportStats(data.stats);
        await getStatus();
        return data.stats;
      } else {
        throw new Error(data.error || 'Failed to import catalog');
      }
    } catch (err: any) {
      console.error('Error importing catalog:', err);
      toast.error(err.message || 'Erro ao importar cardápio');
      throw err;
    } finally {
      setImporting(false);
    }
  }, [establishmentId, getStatus]);

  const refreshToken = useCallback(async () => {
    if (!establishmentId) return;
    
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('ifood-oauth', {
        body: {
          action: 'refresh_token',
          establishmentId,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('Token renovado');
        await getStatus();
      } else {
        throw new Error(data.error || 'Failed to refresh token');
      }
    } catch (err: any) {
      console.error('Error refreshing token:', err);
      toast.error(err.message || 'Erro ao renovar token');
    } finally {
      setLoading(false);
    }
  }, [establishmentId, getStatus]);

  return {
    loading,
    importing,
    connectionStatus,
    userCodeData,
    importStats,
    getStatus,
    generateUserCode,
    exchangeToken,
    disconnect,
    importCatalog,
    refreshToken,
    setUserCodeData,
  };
}
