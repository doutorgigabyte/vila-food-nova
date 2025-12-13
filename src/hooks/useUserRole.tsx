import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Tipos de roles no sistema
export type AppRole = 'super_admin' | 'establishment' | 'customer';
export type EstablishmentRole = 'manager' | 'cashier' | 'attendant' | 'waiter' | 'delivery';

export interface UserRoleInfo {
  appRole: AppRole | null;
  establishmentRole: EstablishmentRole | null;
  establishmentId: string | null;
  establishmentSlug: string | null;
  isLoading: boolean;
}

export interface RolePermissions {
  canAccessAdmin: boolean;
  canAccessDashboard: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageFinance: boolean;
  canAccessPDV: boolean;
  canAccessKitchen: boolean;
  canAccessWaiterApp: boolean;
  canManageDelivery: boolean;
}

// Definir permissões por role
const rolePermissions: Record<EstablishmentRole, RolePermissions> = {
  manager: {
    canAccessAdmin: false,
    canAccessDashboard: true,
    canManageProducts: true,
    canManageOrders: true,
    canManageFinance: true,
    canAccessPDV: true,
    canAccessKitchen: true,
    canAccessWaiterApp: true,
    canManageDelivery: true,
  },
  cashier: {
    canAccessAdmin: false,
    canAccessDashboard: true,
    canManageProducts: false,
    canManageOrders: true,
    canManageFinance: false,
    canAccessPDV: true,
    canAccessKitchen: false,
    canAccessWaiterApp: false,
    canManageDelivery: false,
  },
  attendant: {
    canAccessAdmin: false,
    canAccessDashboard: true,
    canManageProducts: false,
    canManageOrders: true,
    canManageFinance: false,
    canAccessPDV: false,
    canAccessKitchen: false,
    canAccessWaiterApp: true,
    canManageDelivery: false,
  },
  waiter: {
    canAccessAdmin: false,
    canAccessDashboard: true,
    canManageProducts: false,
    canManageOrders: true,
    canManageFinance: false,
    canAccessPDV: false,
    canAccessKitchen: false,
    canAccessWaiterApp: true,
    canManageDelivery: false,
  },
  delivery: {
    canAccessAdmin: false,
    canAccessDashboard: true,
    canManageProducts: false,
    canManageOrders: true,
    canManageFinance: false,
    canAccessPDV: false,
    canAccessKitchen: false,
    canAccessWaiterApp: false,
    canManageDelivery: true,
  },
};

// Super admin tem todas as permissões
const superAdminPermissions: RolePermissions = {
  canAccessAdmin: true,
  canAccessDashboard: true,
  canManageProducts: true,
  canManageOrders: true,
  canManageFinance: true,
  canAccessPDV: true,
  canAccessKitchen: true,
  canAccessWaiterApp: true,
  canManageDelivery: true,
};

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>({
    appRole: null,
    establishmentRole: null,
    establishmentId: null,
    establishmentSlug: null,
    isLoading: true,
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        setRoleInfo({
          appRole: null,
          establishmentRole: null,
          establishmentId: null,
          establishmentSlug: null,
          isLoading: false,
        });
        return;
      }

      try {
        // Verificar role do app (super_admin, establishment, customer)
        const { data: appRoleData } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'super_admin'
        });

        if (appRoleData) {
          setRoleInfo({
            appRole: 'super_admin',
            establishmentRole: null,
            establishmentId: null,
            establishmentSlug: null,
            isLoading: false,
          });
          return;
        }

        // Verificar se é dono de estabelecimento
        const { data: ownedEstablishment } = await supabase
          .from('establishments')
          .select('id, slug')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (ownedEstablishment) {
          setRoleInfo({
            appRole: 'establishment',
            establishmentRole: 'manager',
            establishmentId: ownedEstablishment.id,
            establishmentSlug: ownedEstablishment.slug,
            isLoading: false,
          });
          return;
        }

        // Verificar se é usuário de estabelecimento
        const { data: estUser } = await supabase
          .from('establishment_users')
          .select(`
            role,
            establishment_id,
            establishments (slug)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (estUser) {
          setRoleInfo({
            appRole: 'establishment',
            establishmentRole: estUser.role as EstablishmentRole,
            establishmentId: estUser.establishment_id,
            establishmentSlug: (estUser.establishments as any)?.slug || null,
            isLoading: false,
          });
          return;
        }

        // Default: customer
        setRoleInfo({
          appRole: 'customer',
          establishmentRole: null,
          establishmentId: null,
          establishmentSlug: null,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRoleInfo({
          appRole: null,
          establishmentRole: null,
          establishmentId: null,
          establishmentSlug: null,
          isLoading: false,
        });
      }
    };

    fetchUserRole();
  }, [user, authLoading]);

  const getPermissions = (): RolePermissions => {
    if (roleInfo.appRole === 'super_admin') {
      return superAdminPermissions;
    }
    
    if (roleInfo.establishmentRole) {
      return rolePermissions[roleInfo.establishmentRole];
    }
    
    // Default: sem permissões
    return {
      canAccessAdmin: false,
      canAccessDashboard: false,
      canManageProducts: false,
      canManageOrders: false,
      canManageFinance: false,
      canAccessPDV: false,
      canAccessKitchen: false,
      canAccessWaiterApp: false,
      canManageDelivery: false,
    };
  };

  const getRedirectPath = (): string => {
    if (roleInfo.appRole === 'super_admin') {
      return '/admin';
    }
    
    if (roleInfo.appRole === 'establishment' && roleInfo.establishmentSlug) {
      const permissions = getPermissions();
      
      if (permissions.canAccessDashboard) {
        return '/painel';
      }
      if (permissions.canAccessWaiterApp) {
        return '/painel/comanda';
      }
      if (permissions.canAccessKitchen) {
        return '/painel/cozinha';
      }
      if (permissions.canAccessPDV) {
        return '/painel/pdv';
      }
    }
    
    return '/marketplace';
  };

  return {
    ...roleInfo,
    permissions: getPermissions(),
    getRedirectPath,
  };
};

// Hook para proteger rotas com base em permissões específicas
export const useRequirePermission = (
  permission: keyof RolePermissions,
  redirectTo: string = '/auth'
) => {
  const navigate = useNavigate();
  const { isLoading, permissions, appRole } = useUserRole();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || isLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!permissions[permission]) {
      navigate(redirectTo);
    }
  }, [user, authLoading, isLoading, permissions, permission, navigate, redirectTo]);

  return { isLoading: isLoading || authLoading, hasPermission: permissions[permission] };
};
