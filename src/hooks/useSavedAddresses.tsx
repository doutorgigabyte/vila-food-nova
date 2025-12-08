import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';

export interface SavedAddress {
  id: string;
  label: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
  lat?: number;
  lng?: number;
  formatted_address?: string;
  is_default?: boolean;
}

export const useSavedAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, addresses')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCustomerId(data.id);
        const savedAddresses = Array.isArray(data.addresses) 
          ? (data.addresses as unknown as SavedAddress[]) 
          : [];
        setAddresses(savedAddresses);
      } else {
        setCustomerId(null);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const saveAddress = async (address: Omit<SavedAddress, 'id'>) => {
    if (!user) {
      toast.error('Faça login para salvar endereços');
      return false;
    }

    try {
      const newAddress: SavedAddress = {
        ...address,
        id: generateUUID(),
        is_default: addresses.length === 0,
      };

      const updatedAddresses = [...addresses, newAddress];

      if (customerId) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update({ addresses: updatedAddresses as any })
          .eq('id', customerId);

        if (error) throw error;
      } else {
        // Create new customer record
        const { data, error } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email || 'Cliente',
            email: user.email,
            addresses: updatedAddresses as any,
          })
          .select('id')
          .single();

        if (error) throw error;
        setCustomerId(data.id);
      }

      setAddresses(updatedAddresses);
      toast.success('Endereço salvo com sucesso!');
      return true;
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Erro ao salvar endereço');
      return false;
    }
  };

  const updateAddress = async (addressId: string, updates: Partial<SavedAddress>) => {
    if (!user || !customerId) return false;

    try {
      const updatedAddresses = addresses.map(addr =>
        addr.id === addressId ? { ...addr, ...updates } : addr
      );

      const { error } = await supabase
        .from('customers')
        .update({ addresses: updatedAddresses as any })
        .eq('id', customerId);

      if (error) throw error;

      setAddresses(updatedAddresses);
      toast.success('Endereço atualizado!');
      return true;
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Erro ao atualizar endereço');
      return false;
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!user || !customerId) return false;

    try {
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);

      // If we deleted the default, make the first one default
      if (updatedAddresses.length > 0 && !updatedAddresses.some(a => a.is_default)) {
        updatedAddresses[0].is_default = true;
      }

      const { error } = await supabase
        .from('customers')
        .update({ addresses: updatedAddresses as any })
        .eq('id', customerId);

      if (error) throw error;

      setAddresses(updatedAddresses);
      toast.success('Endereço removido!');
      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Erro ao remover endereço');
      return false;
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!user || !customerId) return false;

    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        is_default: addr.id === addressId,
      }));

      const { error } = await supabase
        .from('customers')
        .update({ addresses: updatedAddresses as any })
        .eq('id', customerId);

      if (error) throw error;

      setAddresses(updatedAddresses);
      return true;
    } catch (error) {
      console.error('Error setting default address:', error);
      return false;
    }
  };

  const getDefaultAddress = () => {
    return addresses.find(addr => addr.is_default) || addresses[0] || null;
  };

  return {
    addresses,
    loading,
    isAuthenticated: !!user,
    saveAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    refetch: fetchAddresses,
  };
};
