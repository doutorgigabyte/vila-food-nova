/**
 * Mercado Pago SDK V2 Hook
 * Inicializa o SDK e fornece acesso às funcionalidades de pagamento
 */

import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

interface MercadoPagoInstance {
  getIdentificationTypes: () => Promise<IdentificationType[]>;
  getPaymentMethods: (options: { bin: string }) => Promise<PaymentMethodsResponse>;
  getIssuers: (options: { paymentMethodId: string; bin: string }) => Promise<Issuer[]>;
  getInstallments: (options: { amount: string; bin: string }) => Promise<InstallmentOption[]>;
  createCardToken: (cardData: CardTokenData) => Promise<CardToken>;
  cardForm: (options: CardFormOptions) => CardFormInstance;
  bricks: () => BricksBuilder;
}

interface IdentificationType {
  id: string;
  name: string;
  type: string;
  min_length: number;
  max_length: number;
}

interface PaymentMethodsResponse {
  results: PaymentMethod[];
}

interface PaymentMethod {
  id: string;
  name: string;
  payment_type_id: string;
  thumbnail: string;
  secure_thumbnail: string;
}

interface Issuer {
  id: string;
  name: string;
  thumbnail: string;
  secure_thumbnail: string;
}

interface InstallmentOption {
  payment_method_id: string;
  payment_type_id: string;
  issuer: Issuer;
  payer_costs: PayerCost[];
}

interface PayerCost {
  installments: number;
  installment_rate: number;
  discount_rate: number;
  labels: string[];
  min_allowed_amount: number;
  max_allowed_amount: number;
  recommended_message: string;
  installment_amount: number;
  total_amount: number;
}

interface CardTokenData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

interface CardToken {
  id: string;
  public_key: string;
  first_six_digits: string;
  last_four_digits: string;
  expiration_month: number;
  expiration_year: number;
  cardholder: {
    name: string;
    identification: {
      type: string;
      number: string;
    };
  };
  status: string;
  date_created: string;
  date_last_updated: string;
  date_due: string;
  luhn_validation: boolean;
  live_mode: boolean;
}

interface CardFormOptions {
  amount: string;
  iframe: boolean;
  form: {
    id: string;
    cardNumber: { id: string; placeholder?: string };
    expirationDate: { id: string; placeholder?: string };
    securityCode: { id: string; placeholder?: string };
    cardholderName: { id: string; placeholder?: string };
    identificationType: { id: string };
    identificationNumber: { id: string; placeholder?: string };
    issuer: { id: string };
    installments: { id: string };
  };
  callbacks: {
    onFormMounted: (error?: Error) => void;
    onSubmit: (event: Event) => void;
    onFetching: (resource: string) => () => void;
    onCardTokenReceived?: (error: Error | null, token: CardToken) => void;
  };
}

interface CardFormInstance {
  mount: () => void;
  unmount: () => void;
  createCardToken: () => Promise<CardToken>;
  getCardFormData: () => Record<string, unknown>;
}

interface BricksBuilder {
  create: (brickName: string, containerId: string, settings: Record<string, unknown>) => Promise<BrickController>;
}

interface BrickController {
  unmount: () => void;
  getFormData: () => Promise<Record<string, unknown>>;
}

export interface UseMercadoPagoSDKReturn {
  mp: MercadoPagoInstance | null;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  deviceId: string | null;
  getIdentificationTypes: () => Promise<IdentificationType[]>;
  getPaymentMethods: (bin: string) => Promise<PaymentMethod[]>;
  getIssuers: (paymentMethodId: string, bin: string) => Promise<Issuer[]>;
  createCardToken: (cardData: CardTokenData) => Promise<CardToken>;
}

const MP_PUBLIC_KEY = 'APP_USR-34f84b02-a8f4-478c-a9eb-9bd32e6f85d3'; // Production public key
const MP_SDK_URL = 'https://sdk.mercadopago.com/js/v2';

let mpSdkLoadPromise: Promise<void> | null = null;

function loadMercadoPagoSDK(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  if (mpSdkLoadPromise) return mpSdkLoadPromise;

  mpSdkLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${MP_SDK_URL}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Mercado Pago SDK')));
      return;
    }
    const script = document.createElement('script');
    script.src = MP_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      mpSdkLoadPromise = null;
      reject(new Error('Failed to load Mercado Pago SDK'));
    };
    document.body.appendChild(script);
  });

  return mpSdkLoadPromise;
}

export function useMercadoPagoSDK(publicKey?: string): UseMercadoPagoSDKReturn {
  const [mp, setMp] = useState<MercadoPagoInstance | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initSDK = () => {
      try {
        if (typeof window.MercadoPago === 'undefined') {
          setTimeout(initSDK, 300);
          return;
        }

        const key = publicKey || MP_PUBLIC_KEY;
        const mpInstance = new window.MercadoPago(key, {
          locale: 'pt-BR'
        });

        setMp(mpInstance);
        setIsLoaded(true);
        setIsLoading(false);

        // Capture Device ID (fingerprint for fraud prevention)
        // The SDK automatically sets this in window.MP_DEVICE_SESSION_ID
        const captureDeviceId = () => {
          // @ts-ignore - MP_DEVICE_SESSION_ID is set by the SDK
          const mpDeviceId = window.MP_DEVICE_SESSION_ID || window.deviceId;
          if (mpDeviceId) {
            setDeviceId(mpDeviceId);
            console.log('[MercadoPago SDK] Device ID captured:', mpDeviceId.substring(0, 20) + '...');
          } else {
            // Retry after a short delay as the SDK may take time to generate it
            setTimeout(captureDeviceId, 1000);
          }
        };
        
        captureDeviceId();
      } catch (err) {
        console.error('[MercadoPago SDK] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Erro ao inicializar SDK');
        setIsLoading(false);
      }
    };

    loadMercadoPagoSDK()
      .then(() => {
        if (!cancelled) initSDK();
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[MercadoPago SDK] Load error:', err);
        setError('Erro ao carregar SDK de pagamento');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const getIdentificationTypes = useCallback(async (): Promise<IdentificationType[]> => {
    if (!mp) throw new Error('SDK não inicializado');
    return mp.getIdentificationTypes();
  }, [mp]);

  const getPaymentMethods = useCallback(async (bin: string): Promise<PaymentMethod[]> => {
    if (!mp) throw new Error('SDK não inicializado');
    const response = await mp.getPaymentMethods({ bin });
    return response.results;
  }, [mp]);

  const getIssuers = useCallback(async (paymentMethodId: string, bin: string): Promise<Issuer[]> => {
    if (!mp) throw new Error('SDK não inicializado');
    return mp.getIssuers({ paymentMethodId, bin });
  }, [mp]);

  const createCardToken = useCallback(async (cardData: CardTokenData): Promise<CardToken> => {
    if (!mp) throw new Error('SDK não inicializado');
    return mp.createCardToken(cardData);
  }, [mp]);

  return {
    mp,
    isLoaded,
    isLoading,
    error,
    deviceId,
    getIdentificationTypes,
    getPaymentMethods,
    getIssuers,
    createCardToken,
  };
}

export default useMercadoPagoSDK;
