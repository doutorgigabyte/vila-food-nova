/**
 * Payment Gateway Types - Interfaces modulares para integração de gateways
 * Suporta Mercado Pago e preparado para futuros gateways (PagSeguro, Stone, Getnet, etc.)
 */

export type PaymentStatus = 
  | 'pending'      // Aguardando pagamento
  | 'approved'     // Aprovado
  | 'authorized'   // Autorizado (cartão)
  | 'in_process'   // Em processamento
  | 'in_mediation' // Em mediação
  | 'rejected'     // Rejeitado
  | 'cancelled'    // Cancelado
  | 'refunded'     // Estornado
  | 'charged_back'; // Chargeback

export type PaymentMethod = 
  | 'pix' 
  | 'credit_card' 
  | 'debit_card' 
  | 'boleto' 
  | 'cash'
  | 'wallet' // Saldo em carteira (MP)
  | 'static_pix'; // PIX copia e cola

export type GatewayProvider = 
  | 'mercadopago' 
  | 'pagseguro' 
  | 'stone'
  | 'getnet'
  | 'cielo'
  | 'stripe' 
  | 'manual';

// Gateway configuration for admin management
export interface GatewayConfig {
  provider: GatewayProvider;
  name: string;
  logo?: string;
  enabled: boolean;
  sandbox: boolean;
  credentials: Record<string, string>;
  features: GatewayFeature[];
  fees?: {
    pix?: number;
    credit?: number;
    debit?: number;
    boleto?: number;
  };
}

export type GatewayFeature = 
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'boleto'
  | 'split_payment'
  | 'subscription'
  | 'refund'
  | 'webhook';

// Gateway metadata for UI display
export const GATEWAY_METADATA: Record<GatewayProvider, {
  name: string;
  logo: string;
  features: GatewayFeature[];
  docsUrl: string;
}> = {
  mercadopago: {
    name: 'Mercado Pago',
    logo: 'https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.92/mercadopago/logo__large@2x.png',
    features: ['pix', 'credit_card', 'debit_card', 'boleto', 'split_payment', 'subscription', 'refund', 'webhook'],
    docsUrl: 'https://www.mercadopago.com.br/developers'
  },
  pagseguro: {
    name: 'PagSeguro',
    logo: 'https://logodownload.org/wp-content/uploads/2019/09/pagseguro-logo-0.png',
    features: ['pix', 'credit_card', 'debit_card', 'boleto', 'refund', 'webhook'],
    docsUrl: 'https://dev.pagseguro.uol.com.br'
  },
  stone: {
    name: 'Stone',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Stone_logo.svg/1200px-Stone_logo.svg.png',
    features: ['pix', 'credit_card', 'debit_card', 'refund', 'webhook'],
    docsUrl: 'https://docs.openfinance.stone.com.br'
  },
  getnet: {
    name: 'Getnet',
    logo: 'https://logodownload.org/wp-content/uploads/2020/02/getnet-logo-0.png',
    features: ['pix', 'credit_card', 'debit_card', 'boleto', 'refund', 'webhook'],
    docsUrl: 'https://developers.getnet.com.br'
  },
  cielo: {
    name: 'Cielo',
    logo: 'https://logodownload.org/wp-content/uploads/2014/05/cielo-logo-0.png',
    features: ['pix', 'credit_card', 'debit_card', 'boleto', 'refund', 'webhook'],
    docsUrl: 'https://developercielo.github.io/manual/cielo-ecommerce'
  },
  stripe: {
    name: 'Stripe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/2560px-Stripe_Logo%2C_revised_2016.svg.png',
    features: ['credit_card', 'debit_card', 'subscription', 'refund', 'webhook'],
    docsUrl: 'https://stripe.com/docs'
  },
  manual: {
    name: 'Manual',
    logo: '',
    features: [],
    docsUrl: ''
  }
};

export interface PayerInfo {
  email: string;
  name?: string;
  phone?: string;
  document?: {
    type: 'CPF' | 'CNPJ';
    number: string;
  };
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
}

export interface PaymentItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  picture_url?: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  establishment_id: string;
  amount: number;
  description: string;
  payment_method: PaymentMethod;
  payer: PayerInfo;
  items?: PaymentItem[];
  // Card specific
  card_token?: string;
  installments?: number;
  issuer_id?: string;
  // Callbacks
  success_url?: string;
  failure_url?: string;
  pending_url?: string;
  webhook_url?: string;
  // Extra
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResponse {
  success: boolean;
  payment_id?: string;
  status: PaymentStatus;
  status_detail?: string;
  gateway?: GatewayProvider;
  // Para PIX
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  pix_copy_paste?: string;
  pix_expiration?: string;
  // Para Boleto
  boleto_url?: string;
  boleto_barcode?: string;
  boleto_expiration?: string;
  // Para Checkout Redirect
  checkout_url?: string;
  // Split/Fees
  platform_fee?: number;
  net_amount?: number;
  // Error
  error?: string;
  error_code?: string;
}

export interface GetPaymentResponse {
  success: boolean;
  payment_id: string;
  status: PaymentStatus;
  status_detail?: string;
  amount?: number;
  paid_amount?: number;
  date_created?: string;
  date_approved?: string;
  date_last_updated?: string;
  payment_method?: PaymentMethod;
  payer_email?: string;
  payer_name?: string;
  // Refund info
  refunded_amount?: number;
  refunds?: RefundInfo[];
  error?: string;
}

export interface RefundInfo {
  id: string;
  amount: number;
  status: string;
  date_created: string;
}

export interface RefundRequest {
  payment_id: string;
  establishment_id: string;
  amount?: number; // Partial refund
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refund_id?: string;
  amount?: number;
  status?: PaymentStatus;
  error?: string;
}

export interface PaymentGatewayConfig {
  provider: GatewayProvider;
  access_token?: string;
  public_key?: string;
  client_id?: string;
  client_secret?: string;
  webhook_secret?: string;
  sandbox?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: number;
  frequency_type: 'days' | 'months';
  features?: string[];
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  establishment_id: string;
  payer_email: string;
  back_url?: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscription_id?: string;
  init_point?: string; // URL para checkout
  status?: string;
  error?: string;
}

// Transaction record for database
export interface PaymentTransaction {
  id: string;
  establishment_id: string;
  order_id?: string;
  gateway: GatewayProvider;
  gateway_payment_id: string;
  type: 'sale' | 'subscription' | 'refund';
  status: PaymentStatus;
  amount: number;
  platform_fee?: number;
  net_amount?: number;
  payment_method?: PaymentMethod;
  payer_email?: string;
  payer_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Helper functions
export function getGatewayDisplayName(provider: GatewayProvider): string {
  return GATEWAY_METADATA[provider]?.name || provider;
}

export function getGatewayFeatures(provider: GatewayProvider): GatewayFeature[] {
  return GATEWAY_METADATA[provider]?.features || [];
}

export function supportsFeature(provider: GatewayProvider, feature: GatewayFeature): boolean {
  return getGatewayFeatures(provider).includes(feature);
}
