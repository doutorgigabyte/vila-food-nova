/**
 * Environment configuration utilities
 * 
 * Centraliza verificação de ambiente para garantir que o sistema
 * use as configurações corretas para produção vs desenvolvimento.
 */

export const isProduction = (): boolean => {
  // Check Vite environment variable first
  if (import.meta.env.VITE_ENVIRONMENT === 'production') {
    return true;
  }
  
  // Check if running in production mode
  if (import.meta.env.PROD) {
    return true;
  }
  
  // Check URL for production domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'vilafood.app' || hostname.endsWith('.vilafood.app')) {
      return true;
    }
  }
  
  return false;
};

export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || false;
};

export const getEnvironmentName = (): 'production' | 'development' | 'staging' => {
  if (isProduction()) return 'production';
  if (import.meta.env.VITE_ENVIRONMENT === 'staging') return 'staging';
  return 'development';
};

// Payment gateway environment helpers
export const getMercadoPagoEnvironment = (): 'production' | 'sandbox' => {
  return isProduction() ? 'production' : 'sandbox';
};

export const getPagSeguroEnvironment = (): 'production' | 'sandbox' => {
  return isProduction() ? 'production' : 'sandbox';
};

// Log environment on initialization
if (typeof window !== 'undefined') {
  console.log(`[VilaFood] Environment: ${getEnvironmentName()}`);
}
