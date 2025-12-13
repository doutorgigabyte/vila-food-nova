/**
 * Mercado Pago Badge - Logotipos oficiais
 * Mostra badges de segurança e métodos de pagamento aceitos
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface MercadoPagoBadgeProps {
  variant?: 'full' | 'compact' | 'methods';
  className?: string;
}

export function MercadoPagoBadge({ variant = 'full', className = '' }: MercadoPagoBadgeProps) {
  if (variant === 'methods') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/visa@2x.png"
          alt="Visa"
          className="h-6"
        />
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/master@2x.png"
          alt="Mastercard"
          className="h-6"
        />
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/elo@2x.png"
          alt="Elo"
          className="h-6"
        />
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/hipercard@2x.png"
          alt="Hipercard"
          className="h-6"
        />
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/pix@2x.png"
          alt="Pix"
          className="h-6"
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <ShieldCheck className="h-4 w-4 text-green-500" />
        <span className="text-xs text-muted-foreground">Pagamento seguro via</span>
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.92/mercadopago/logo__small.png"
          alt="Mercado Pago"
          className="h-4"
        />
      </div>
    );
  }

  // Full variant
  return (
    <div className={`rounded-lg border p-4 bg-card ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">Pagamento 100% Seguro</span>
        </div>
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.92/mercadopago/logo__large@2x.png"
          alt="Mercado Pago"
          className="h-6"
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
        <span className="text-xs text-muted-foreground mr-2">Aceitamos:</span>
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/visa@2x.png"
          alt="Visa"
          className="h-5"
        />
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/master@2x.png"
          alt="Mastercard"
          className="h-5"
        />
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/elo@2x.png"
          alt="Elo"
          className="h-5"
        />
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/hipercard@2x.png"
          alt="Hipercard"
          className="h-5"
        />
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/amex@2x.png"
          alt="American Express"
          className="h-5"
        />
        <img 
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/payment-methods/icons/pix@2x.png"
          alt="Pix"
          className="h-5"
        />
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Seus dados são protegidos com criptografia de ponta a ponta e não armazenamos informações do seu cartão.
      </p>
    </div>
  );
}

export default MercadoPagoBadge;
