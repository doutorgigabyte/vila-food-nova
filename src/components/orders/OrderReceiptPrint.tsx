import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  observations?: string;
  additionals?: { name: string; price: number }[];
}

interface OrderReceiptProps {
  order: {
    order_number: number;
    created_at: string;
    delivery_type: string;
    table_number?: string | null;
    items: OrderItem[];
    subtotal: number;
    delivery_fee: number;
    discount: number;
    total: number;
    payment_method: string;
    observations?: string | null;
    delivery_address?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      zip_code?: string;
    } | null;
    customer_name?: string;
    customer_phone?: string;
  };
  establishment: {
    name: string;
    phone?: string | null;
    whatsapp?: string | null;
    address?: string | null;
    logo_url?: string | null;
  };
}

export const generateReceiptHTML = ({ order, establishment }: OrderReceiptProps): string => {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy, HH:mm:ss", { locale: ptBR });
  };

  const getDeliveryTypeLabel = () => {
    switch (order.delivery_type) {
      case 'delivery': return 'ENTREGA';
      case 'turbo': return 'ENTREGA TURBO';
      case 'pickup': return 'RETIRADA';
      case 'table': return `MESA ${order.table_number || ''}`;
      default: return order.delivery_type.toUpperCase();
    }
  };

  const getPaymentMethodLabel = () => {
    switch (order.payment_method) {
      case 'pix': return 'PIX';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'cash': return 'Dinheiro';
      case 'card_on_delivery': return 'Cartão na Entrega';
      default: return order.payment_method;
    }
  };

  const formatAddress = () => {
    if (!order.delivery_address) return '';
    const addr = order.delivery_address;
    const parts = [
      addr.street,
      addr.number,
      addr.complement ? `- ${addr.complement}` : '',
    ].filter(Boolean).join(' ');
    
    const location = [
      addr.neighborhood,
      addr.city,
    ].filter(Boolean).join(' - ');
    
    return `${parts}<br>${location}<br>CEP: ${addr.zip_code || ''}`;
  };

  const itemsHTML = (order.items || []).map((item: OrderItem) => {
    const itemTotal = item.price * item.quantity;
    let additionalsHTML = '';
    
    if (item.additionals && item.additionals.length > 0) {
      additionalsHTML = item.additionals.map(add => 
        `<div class="additional">  + ${add.name} (${formatCurrency(add.price)})</div>`
      ).join('');
    }

    const obsHTML = item.observations ? 
      `<div class="item-obs">Obs: ${item.observations}</div>` : '';

    return `
      <div class="item-row">
        <span class="item-left">${item.quantity}x ${item.name}</span>
        <span class="item-right">${formatCurrency(itemTotal)}</span>
      </div>
      ${additionalsHTML}
      ${obsHTML}
    `;
  }).join('');

  // Gerar linha de separação com caracteres
  const separator = '-'.repeat(42);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Comanda #${order.order_number}</title>
      <style>
        @page { margin: 0; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          width: 80mm;
          max-width: 80mm;
          padding: 5mm;
          line-height: 1.5;
          color: #000;
          background: #fff;
        }

        .header {
          text-align: center;
          margin-bottom: 8px;
        }

        .title {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 2px;
        }

        .datetime {
          font-size: 11px;
          margin: 6px 0;
        }

        .delivery-type {
          font-size: 12px;
          font-weight: bold;
        }

        .separator {
          text-align: center;
          color: #999;
          letter-spacing: -1px;
          margin: 8px 0;
        }

        .info-row {
          display: flex;
          margin: 4px 0;
        }

        .info-label {
          min-width: 70px;
        }

        .items-section {
          margin: 8px 0;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }

        .item-left {
          flex: 1;
        }

        .item-right {
          text-align: right;
          min-width: 70px;
        }

        .additional {
          font-size: 10px;
          color: #555;
          padding-left: 16px;
        }

        .item-obs {
          font-size: 10px;
          color: #666;
          padding-left: 16px;
          font-style: italic;
        }

        .totals-section {
          margin: 8px 0;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }

        .total-row.final {
          font-weight: bold;
          font-size: 14px;
          margin-top: 6px;
        }

        .payment-section {
          margin: 8px 0;
        }

        .footer {
          text-align: center;
          margin-top: 12px;
          padding-top: 8px;
        }

        .thanks {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }

        .establishment-name {
          font-size: 12px;
          font-weight: bold;
        }

        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">COMANDA #${order.order_number}</div>
        <div class="datetime">${formatDate(order.created_at)}</div>
        <div class="delivery-type">${getDeliveryTypeLabel()}</div>
      </div>

      <div class="separator">${separator}</div>

      ${order.customer_name ? `
        <div class="info-row">
          <span class="info-label">Cliente:</span>
          <span>${order.customer_name}</span>
        </div>
      ` : ''}

      ${order.customer_phone ? `
        <div class="info-row">
          <span class="info-label">Telefone:</span>
          <span>${order.customer_phone}</span>
        </div>
      ` : ''}

      ${(order.delivery_type === 'delivery' || order.delivery_type === 'turbo') && order.delivery_address ? `
        <div class="separator">${separator}</div>
        <div class="info-row">
          <span class="info-label">Endereço:</span>
        </div>
        <div style="padding-left: 8px; font-size: 11px;">${formatAddress()}</div>
      ` : ''}

      <div class="separator">${separator}</div>

      <div class="items-section">
        ${itemsHTML}
      </div>

      <div class="separator">${separator}</div>

      <div class="totals-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        ${order.delivery_fee > 0 ? `
          <div class="total-row">
            <span>Taxa de entrega:</span>
            <span>${formatCurrency(order.delivery_fee)}</span>
          </div>
        ` : ''}
        ${order.discount > 0 ? `
          <div class="total-row">
            <span>Desconto:</span>
            <span>-${formatCurrency(order.discount)}</span>
          </div>
        ` : ''}
        <div class="total-row final">
          <span>TOTAL:</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
      </div>

      <div class="separator">${separator}</div>

      <div class="payment-section">
        <div class="info-row">
          <span class="info-label">Pagamento:</span>
          <span>${getPaymentMethodLabel()}</span>
        </div>
      </div>

      ${order.observations ? `
        <div class="separator">${separator}</div>
        <div class="info-row">
          <span class="info-label">Obs:</span>
          <span>${order.observations}</span>
        </div>
      ` : ''}

      <div class="footer">
        <div class="thanks">Obrigado pela preferência!</div>
        <div class="establishment-name">${establishment.name}</div>
      </div>
    </body>
    </html>
  `;
};

export const printOrderReceipt = (props: OrderReceiptProps) => {
  const html = generateReceiptHTML(props);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

export default printOrderReceipt;
