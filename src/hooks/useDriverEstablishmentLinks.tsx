import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DriverEstablishmentLink {
  id: string;
  driver_id: string;
  establishment_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  linked_via: 'qr_code' | 'manual' | 'invitation';
  commission_type: 'external' | 'split_pix' | 'fixed' | 'percentage';
  fixed_fee: number | null;
  percentage_fee: number | null;
  created_at: string;
  approved_at: string | null;
  establishment?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicle_type: string | null;
  };
}

// Hook for drivers to manage their establishment links
export const useDriverLinks = (driverId?: string) => {
  const [links, setLinks] = useState<DriverEstablishmentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLinks = useCallback(async () => {
    if (!driverId) return;
    
    try {
      const { data, error } = await supabase
        .from('driver_establishment_links')
        .select(`
          *,
          establishment:establishments(id, name, logo_url)
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks((data || []) as DriverEstablishmentLink[]);
    } catch (error) {
      console.error('Error fetching driver links:', error);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  const linkToEstablishment = async (establishmentId: string, via: 'qr_code' | 'manual' = 'qr_code') => {
    if (!driverId) return false;

    try {
      const { error } = await supabase
        .from('driver_establishment_links')
        .insert({
          driver_id: driverId,
          establishment_id: establishmentId,
          linked_via: via,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Já vinculado",
            description: "Você já solicitou vínculo com este estabelecimento",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return false;
      }

      toast({
        title: "Solicitação enviada!",
        description: "Aguarde a aprovação do estabelecimento",
      });
      
      fetchLinks();
      return true;
    } catch (error) {
      console.error('Error linking to establishment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível solicitar vínculo",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return {
    links,
    loading,
    linkToEstablishment,
    refetch: fetchLinks,
    approvedLinks: links.filter(l => l.status === 'approved'),
    pendingLinks: links.filter(l => l.status === 'pending')
  };
};

// Hook for establishments to manage driver link requests
export const useEstablishmentDriverLinks = (establishmentId?: string) => {
  const [links, setLinks] = useState<DriverEstablishmentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLinks = useCallback(async () => {
    if (!establishmentId) return;
    
    try {
      const { data, error } = await supabase
        .from('driver_establishment_links')
        .select(`
          *,
          driver:delivery_drivers(id, name, phone, vehicle_type)
        `)
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks((data || []) as DriverEstablishmentLink[]);
    } catch (error) {
      console.error('Error fetching establishment driver links:', error);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  const updateLinkStatus = async (
    linkId: string, 
    status: 'approved' | 'rejected' | 'blocked',
    commissionConfig?: {
      commission_type: string;
      fixed_fee?: number;
      percentage_fee?: number;
    }
  ) => {
    try {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        if (commissionConfig) {
          updateData.commission_type = commissionConfig.commission_type;
          updateData.fixed_fee = commissionConfig.fixed_fee;
          updateData.percentage_fee = commissionConfig.percentage_fee;
        }
      }

      const { error } = await supabase
        .from('driver_establishment_links')
        .update(updateData)
        .eq('id', linkId);

      if (error) throw error;

      const messages = {
        approved: 'Entregador aprovado com sucesso',
        rejected: 'Solicitação rejeitada',
        blocked: 'Entregador bloqueado'
      };

      toast({
        title: messages[status],
      });
      
      fetchLinks();
      return true;
    } catch (error) {
      console.error('Error updating link status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return {
    links,
    loading,
    updateLinkStatus,
    refetch: fetchLinks,
    pendingLinks: links.filter(l => l.status === 'pending'),
    approvedLinks: links.filter(l => l.status === 'approved'),
    blockedLinks: links.filter(l => l.status === 'blocked')
  };
};
