import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncMapping {
  id: string;
  establishment_id: string;
  localiza_place_id: string;
  google_place_id: string | null;
  sync_status: "active" | "paused" | "error";
  last_synced_at: string | null;
}

interface SyncLogEntry {
  id: string;
  sync_type: string;
  direction: string;
  status: string;
  records_processed: number | null;
  records_failed: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

interface SyncStatus {
  total_mapped: number;
  active_mappings: number;
  sync_enabled_establishments: number;
  recent_syncs: SyncLogEntry[];
  last_successful_sync: string | null;
}

interface LocalizaSyncData {
  syncEnabled: boolean;
  syncedAt: string | null;
  localizaPlaceId: string | null;
  mapping: SyncMapping | null;
  syncStatus: SyncStatus | null;
  loading: boolean;
  toggling: boolean;
  toggleSync: (enabled: boolean) => Promise<void>;
  triggerSync: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useLocalizaSync(establishmentId: string | null): LocalizaSyncData {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [localizaPlaceId, setLocalizaPlaceId] = useState<string | null>(null);
  const [mapping, setMapping] = useState<SyncMapping | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    if (!establishmentId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch establishment sync fields
      const { data: est, error: estError } = await supabase
        .from("establishments")
        .select("localiza_sync_enabled, localiza_synced_at, localiza_place_id")
        .eq("id", establishmentId)
        .single();

      if (estError) throw estError;

      setSyncEnabled(est?.localiza_sync_enabled ?? false);
      setSyncedAt(est?.localiza_synced_at ?? null);
      setLocalizaPlaceId(est?.localiza_place_id ?? null);

      // Fetch mapping if exists
      const { data: mappingData } = await supabase
        .from("localiza_place_mapping")
        .select("*")
        .eq("establishment_id", establishmentId)
        .maybeSingle();

      setMapping(mappingData as SyncMapping | null);

      // Fetch global sync status
      const { data: statusData } = await supabase.rpc("get_localiza_sync_status");
      setSyncStatus(statusData as unknown as SyncStatus | null);
    } catch (error) {
      console.error("Error fetching localiza sync data:", error);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSync = async (enabled: boolean) => {
    if (!establishmentId) return;

    setToggling(true);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ localiza_sync_enabled: enabled })
        .eq("id", establishmentId);

      if (error) throw error;

      setSyncEnabled(enabled);
      toast.success(
        enabled
          ? "Sincronização com LocalizAI ativada"
          : "Sincronização com LocalizAI desativada"
      );
    } catch (error) {
      console.error("Error toggling sync:", error);
      toast.error("Erro ao alterar sincronização");
    } finally {
      setToggling(false);
    }
  };

  const triggerSync = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("sync-localiza", {
        body: { action: "sync_establishments_to_localiza" },
      });

      if (error) throw error;

      toast.success(
        `Sincronização concluída: ${data?.processed || 0} estabelecimento(s) processado(s)`
      );
      await fetchData();
    } catch (error) {
      console.error("Error triggering sync:", error);
      toast.error("Erro ao executar sincronização");
    }
  };

  return {
    syncEnabled,
    syncedAt,
    localizaPlaceId,
    mapping,
    syncStatus,
    loading,
    toggling,
    toggleSync,
    triggerSync,
    refreshStatus: fetchData,
  };
}
