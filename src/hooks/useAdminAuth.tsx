import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        // No user - not an admin, but don't redirect (let component handle it)
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Verificar se o usuário tem role de super_admin
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'super_admin'
        });

        if (error) {
          console.error('[useAdminAuth] Error checking admin role:', error);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        if (!data) {
          console.log('[useAdminAuth] User is not super_admin, user_id:', user.id);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        console.log('[useAdminAuth] User is super_admin');
        setIsAdmin(true);
        setLoading(false);
      } catch (error) {
        console.error('[useAdminAuth] Error checking admin role:', error);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading, user };
};
