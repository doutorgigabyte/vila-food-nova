import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Json } from '@/integrations/supabase/types';

interface AuditLogData {
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Json;
  newData?: Json;
  metadata?: Json;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = useCallback(async (data: AuditLogData) => {
    // Ignorar logs para usuários não autenticados (anonymous checkout)
    if (!user) return;

    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        old_data: data.oldData || null,
        new_data: data.newData || null,
        user_agent: navigator.userAgent,
        metadata: data.metadata || {}
      }]);
    } catch (error) {
      // Silenciar erros de RLS para não poluir console
      if (process.env.NODE_ENV === 'development') {
        console.warn('Audit log skipped (likely RLS):', error);
      }
    }
  }, [user]);

  const logAdminAccess = useCallback(async (establishmentId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('admin_access_logs')
        .insert([{
          admin_user_id: user.id,
          establishment_id: establishmentId,
          action: 'access',
          metadata: { user_agent: navigator.userAgent }
        }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to log admin access:', error);
      return null;
    }
  }, [user]);

  const endAdminAccess = useCallback(async (accessLogId: string) => {
    try {
      await supabase
        .from('admin_access_logs')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', accessLogId);
    } catch (error) {
      console.error('Failed to end admin access log:', error);
    }
  }, []);

  return { logAction, logAdminAccess, endAdminAccess };
};
