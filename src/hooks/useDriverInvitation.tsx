import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DriverInvitationToken {
  id: string;
  establishment_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

// Generate a random 8-character alphanumeric token
const generateToken = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const useDriverInvitation = (establishmentId?: string) => {
  const [loading, setLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState<DriverInvitationToken | null>(null);
  const { toast } = useToast();

  const createInvitation = useCallback(async () => {
    if (!establishmentId) return null;

    setLoading(true);
    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const { data, error } = await supabase
        .from('driver_invitation_tokens')
        .insert({
          establishment_id: establishmentId,
          token,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentToken(data as DriverInvitationToken);
      return data as DriverInvitationToken;
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o convite",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [establishmentId, toast]);

  const getActiveInvitation = useCallback(async () => {
    if (!establishmentId) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('driver_invitation_tokens')
        .select('*')
        .eq('establishment_id', establishmentId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setCurrentToken(data as DriverInvitationToken | null);
      return data as DriverInvitationToken | null;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  const invalidateToken = useCallback(async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('driver_invitation_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;

      setCurrentToken(null);
      toast({
        title: "Link invalidado",
        description: "O convite foi cancelado"
      });
      return true;
    } catch (error) {
      console.error('Error invalidating token:', error);
      return false;
    }
  }, [toast]);

  const getInvitationUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/entregador/cadastro?invite=${token}`;
  };

  return {
    loading,
    currentToken,
    createInvitation,
    getActiveInvitation,
    invalidateToken,
    getInvitationUrl
  };
};

// Hook to validate an invitation token (for registration page)
export const useValidateInvitation = () => {
  const [loading, setLoading] = useState(false);
  const [establishmentName, setEstablishmentName] = useState<string | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

  const validateToken = useCallback(async (token: string) => {
    if (!token) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('driver_invitation_tokens')
        .select(`
          *,
          establishments:establishment_id (id, name)
        `)
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      if (!data) return false;

      const establishment = data.establishments as { id: string; name: string } | null;
      if (establishment) {
        setEstablishmentName(establishment.name);
        setEstablishmentId(establishment.id);
      }
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const markTokenAsUsed = useCallback(async (token: string, driverId: string) => {
    try {
      const { error } = await supabase
        .from('driver_invitation_tokens')
        .update({
          used_at: new Date().toISOString(),
          used_by: driverId
        })
        .eq('token', token);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking token as used:', error);
      return false;
    }
  }, []);

  return {
    loading,
    establishmentName,
    establishmentId,
    validateToken,
    markTokenAsUsed
  };
};
