import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Item 3.2 do roadmap (UX-HARMONIZATION) + 6.5 LGPD: hook para o privacy
// view do Vila Food. Espelha lib/memberPrivacy.ts do Rota T (mesma API).
//
// Source: vila-food-nova/supabase/migrations/20260616000001_lgpd_export_and_delete.sql

export interface DeletionStatus {
  status: 'no_pending_request' | 'pending';
  request_id?: number;
  requested_at?: string;
  scheduled_for?: string;
  days_remaining?: number;
}

export interface UseMemberPrivacyResult {
  deletionStatus: DeletionStatus | null;
  loading: boolean;
  error: string | null;
  exporting: boolean;
  requesting: boolean;
  cancelling: boolean;
  exportData: () => Promise<unknown | null>;
  requestDeletion: (reason?: string) => Promise<boolean>;
  cancelDeletion: (reason?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useMemberPrivacy(): UseMemberPrivacyResult {
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('member_get_deletion_status');
    if (err) {
      setError(err.message);
      setDeletionStatus(null);
    } else {
      setDeletionStatus(data as DeletionStatus);
    }
    setLoading(false);
  }, []);

  const exportData = useCallback(async (): Promise<unknown | null> => {
    setExporting(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('member_export_my_data');
    setExporting(false);
    if (err) {
      setError(err.message);
      return null;
    }
    return data;
  }, []);

  const requestDeletion = useCallback(async (reason?: string): Promise<boolean> => {
    setRequesting(true);
    setError(null);
    const { error: err } = await supabase.rpc('member_request_account_deletion', {
      p_reason: reason ?? null,
    });
    setRequesting(false);
    if (err) {
      setError(err.message);
      return false;
    }
    await refresh();
    return true;
  }, [refresh]);

  const cancelDeletion = useCallback(async (reason?: string): Promise<boolean> => {
    setCancelling(true);
    setError(null);
    const { error: err } = await supabase.rpc('member_cancel_deletion_request', {
      p_reason: reason ?? null,
    });
    setCancelling(false);
    if (err) {
      setError(err.message);
      return false;
    }
    await refresh();
    return true;
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    deletionStatus,
    loading,
    error,
    exporting,
    requesting,
    cancelling,
    exportData,
    requestDeletion,
    cancelDeletion,
    refresh,
  };
}

export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
