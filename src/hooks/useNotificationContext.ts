import { useLocation } from "react-router-dom";

export type NotificationContext = 'admin' | 'establishment' | 'customer';

/**
 * Hook to determine the current notification context based on the route
 * - admin: /admin/* routes - only receives admin/platform-level notifications
 * - establishment: /painel/:slug/* routes - receives establishment-specific notifications
 * - customer: all other routes - receives customer-specific notifications
 */
export const useNotificationRoutingContext = () => {
  const location = useLocation();
  
  const getContext = (): NotificationContext => {
    if (location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    if (location.pathname.startsWith('/painel/')) {
      return 'establishment';
    }
    return 'customer';
  };
  
  const getEstablishmentSlugFromPath = (): string | null => {
    const match = location.pathname.match(/^\/painel\/([^/]+)/);
    return match ? match[1] : null;
  };
  
  return {
    context: getContext(),
    establishmentSlug: getEstablishmentSlugFromPath(),
    isAdminContext: location.pathname.startsWith('/admin'),
    isEstablishmentContext: location.pathname.startsWith('/painel/'),
    isCustomerContext: !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/painel/'),
  };
};
