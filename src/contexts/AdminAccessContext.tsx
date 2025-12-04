import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuditLog } from '@/hooks/useAuditLog';

interface AdminAccessContextType {
  accessingEstablishmentId: string | null;
  accessLogId: string | null;
  startAccessingEstablishment: (establishmentId: string) => Promise<void>;
  stopAccessingEstablishment: () => Promise<void>;
  isAccessingEstablishment: boolean;
}

const AdminAccessContext = createContext<AdminAccessContextType | undefined>(undefined);

export const AdminAccessProvider = ({ children }: { children: ReactNode }) => {
  const [accessingEstablishmentId, setAccessingEstablishmentId] = useState<string | null>(null);
  const [accessLogId, setAccessLogId] = useState<string | null>(null);
  const { logAdminAccess, endAdminAccess } = useAuditLog();

  const startAccessingEstablishment = useCallback(async (establishmentId: string) => {
    const logId = await logAdminAccess(establishmentId);
    setAccessingEstablishmentId(establishmentId);
    setAccessLogId(logId);
  }, [logAdminAccess]);

  const stopAccessingEstablishment = useCallback(async () => {
    if (accessLogId) {
      await endAdminAccess(accessLogId);
    }
    setAccessingEstablishmentId(null);
    setAccessLogId(null);
  }, [accessLogId, endAdminAccess]);

  return (
    <AdminAccessContext.Provider value={{
      accessingEstablishmentId,
      accessLogId,
      startAccessingEstablishment,
      stopAccessingEstablishment,
      isAccessingEstablishment: !!accessingEstablishmentId
    }}>
      {children}
    </AdminAccessContext.Provider>
  );
};

export const useAdminAccess = () => {
  const context = useContext(AdminAccessContext);
  if (!context) {
    throw new Error('useAdminAccess must be used within AdminAccessProvider');
  }
  return context;
};
