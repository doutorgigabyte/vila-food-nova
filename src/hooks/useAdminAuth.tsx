import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        setLoading(false);
        // Salvar a página atual para redirecionar após login
        navigate('/auth', { state: { from: location.pathname } });
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
          // NÃO fazer navegação automática - deixar o componente decidir
          return;
        }

        if (!data) {
          console.log('[useAdminAuth] User is not super_admin, user_id:', user.id);
          setIsAdmin(false);
          setLoading(false);
          // NÃO fazer navegação automática - deixar o componente decidir
          return;
        }

        console.log('[useAdminAuth] User is super_admin');
        setIsAdmin(true);
        setLoading(false);
      } catch (error) {
        console.error('[useAdminAuth] Error checking admin role:', error);
        setIsAdmin(false);
        setLoading(false);
        // NÃO fazer navegação automática - deixar o componente decidir
      }
    };

    checkAdminRole();
  }, [user, authLoading, navigate, location.pathname]);

  return { isAdmin, loading: loading || authLoading, user };
};
