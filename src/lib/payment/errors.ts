/**
 * Mapeamento de erros de rejeição de cartão do Mercado Pago
 * Baseado na documentação oficial para tratamento granular de erros
 */

export interface CardRejectionInfo {
  title: string;
  message: string;
  action: 'highlight_card_number' | 'highlight_cvv' | 'highlight_expiry' | 'show_modal' | 'suggest_pix' | 'block_retry' | 'block_card';
  canRetry: boolean;
  suggestAlternative: boolean;
}

export const CARD_REJECTION_MESSAGES: Record<string, CardRejectionInfo> = {
  // Erros de validação de dados
  cc_rejected_bad_filled_card_number: {
    title: 'Número do cartão inválido',
    message: 'Verifique o número digitado e tente novamente.',
    action: 'highlight_card_number',
    canRetry: true,
    suggestAlternative: false
  },
  cc_rejected_bad_filled_security_code: {
    title: 'CVV incorreto',
    message: 'O código de segurança está incorreto. Verifique os 3 dígitos no verso do cartão.',
    action: 'highlight_cvv',
    canRetry: true,
    suggestAlternative: false
  },
  cc_rejected_bad_filled_date: {
    title: 'Data de validade inválida',
    message: 'Verifique a data de validade do seu cartão.',
    action: 'highlight_expiry',
    canRetry: true,
    suggestAlternative: false
  },
  cc_rejected_bad_filled_other: {
    title: 'Dados incorretos',
    message: 'Verifique todos os dados do cartão e tente novamente.',
    action: 'highlight_card_number',
    canRetry: true,
    suggestAlternative: false
  },

  // Erros financeiros
  cc_rejected_insufficient_amount: {
    title: 'Saldo insuficiente',
    message: 'Seu cartão não possui limite ou saldo disponível para esta compra.',
    action: 'suggest_pix',
    canRetry: false,
    suggestAlternative: true
  },
  cc_rejected_max_attempts: {
    title: 'Limite de tentativas excedido',
    message: 'Você atingiu o limite de tentativas. Tente com outro cartão ou use PIX.',
    action: 'suggest_pix',
    canRetry: false,
    suggestAlternative: true
  },

  // Erros de autorização
  cc_rejected_call_for_authorize: {
    title: 'Autorização necessária',
    message: 'Seu banco precisa autorizar esta compra. Abra o app do seu banco, autorize e tente novamente.',
    action: 'show_modal',
    canRetry: true,
    suggestAlternative: false
  },
  cc_rejected_card_disabled: {
    title: 'Cartão desabilitado',
    message: 'Este cartão está desabilitado para compras online. Entre em contato com seu banco.',
    action: 'suggest_pix',
    canRetry: false,
    suggestAlternative: true
  },

  // Erros de segurança/risco
  cc_rejected_high_risk: {
    title: 'Pagamento não aprovado',
    message: 'Por segurança, este pagamento não foi aprovado. Tente outra forma de pagamento.',
    action: 'block_retry',
    canRetry: false,
    suggestAlternative: true
  },
  cc_rejected_blacklist: {
    title: 'Cartão bloqueado',
    message: 'Este cartão não pode ser utilizado. Use outro cartão ou PIX.',
    action: 'block_card',
    canRetry: false,
    suggestAlternative: true
  },
  cc_rejected_duplicated_payment: {
    title: 'Pagamento duplicado',
    message: 'Você já realizou um pagamento com este valor recentemente. Verifique seu extrato.',
    action: 'block_retry',
    canRetry: false,
    suggestAlternative: false
  },

  // Erros de cartão
  cc_rejected_card_error: {
    title: 'Erro no cartão',
    message: 'Não foi possível processar seu cartão. Tente novamente ou use outro meio de pagamento.',
    action: 'suggest_pix',
    canRetry: true,
    suggestAlternative: true
  },
  cc_rejected_other_reason: {
    title: 'Pagamento não aprovado',
    message: 'O pagamento foi recusado. Tente outro cartão ou use PIX.',
    action: 'suggest_pix',
    canRetry: false,
    suggestAlternative: true
  }
};

/**
 * Retorna informações sobre um erro de rejeição de cartão
 */
export function getCardRejectionInfo(statusDetail: string): CardRejectionInfo {
  return CARD_REJECTION_MESSAGES[statusDetail] || {
    title: 'Pagamento não aprovado',
    message: 'Não foi possível processar seu pagamento. Tente novamente ou use outro meio.',
    action: 'suggest_pix',
    canRetry: true,
    suggestAlternative: true
  };
}

/**
 * Verifica se o erro permite retentativa
 */
export function canRetryPayment(statusDetail: string): boolean {
  const info = getCardRejectionInfo(statusDetail);
  return info.canRetry;
}

/**
 * Verifica se deve sugerir método alternativo
 */
export function shouldSuggestAlternative(statusDetail: string): boolean {
  const info = getCardRejectionInfo(statusDetail);
  return info.suggestAlternative;
}
