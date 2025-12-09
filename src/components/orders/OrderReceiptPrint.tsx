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
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getDeliveryTypeLabel = () => {
    switch (order.delivery_type) {
      case 'delivery': return '🚚 ENTREGA';
      case 'turbo': return '⚡ ENTREGA TURBO';
      case 'pickup': return '🏪 RETIRADA';
      case 'table': return `🍽️ MESA ${order.table_number || ''}`;
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
    
    return `${parts}\n${location}\nCEP: ${addr.zip_code || ''}`;
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
      `<div class="item-obs">📝 ${item.observations}</div>` : '';

    return `
      <div class="item">
        <div class="item-line">
          <span class="item-qty">${item.quantity}x</span>
          <span class="item-name">${item.name}</span>
          <span class="item-price">${formatCurrency(itemTotal)}</span>
        </div>
        ${additionalsHTML}
        ${obsHTML}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pedido #${order.order_number} - ${establishment.name}</title>
      <style>
        @page { margin: 0; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          width: 80mm;
          max-width: 80mm;
          padding: 8mm;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }

        .header {
          text-align: center;
          border-bottom: 2px dashed #333;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }

        .logo-name {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .order-number {
          font-size: 24px;
          font-weight: bold;
          background: #000;
          color: #fff;
          padding: 6px 12px;
          display: inline-block;
          margin: 8px 0;
          border-radius: 4px;
        }

        .datetime {
          font-size: 11px;
          color: #444;
        }

        .delivery-type {
          font-size: 14px;
          font-weight: bold;
          margin-top: 8px;
          padding: 4px 8px;
          background: #f0f0f0;
          display: inline-block;
          border-radius: 3px;
        }

        .section {
          margin: 12px 0;
          padding: 8px 0;
          border-bottom: 1px dashed #aaa;
        }

        .section-title {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }

        .customer-info {
          font-size: 12px;
        }

        .customer-name {
          font-weight: bold;
          font-size: 13px;
        }

        .address-box {
          background: #f8f8f8;
          padding: 8px;
          border-radius: 4px;
          margin-top: 6px;
          white-space: pre-line;
        }

        .items-section {
          margin: 12px 0;
        }

        .item {
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px dotted #ddd;
        }

        .item:last-child {
          border-bottom: none;
        }

        .item-line {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .item-qty {
          font-weight: bold;
          min-width: 24px;
        }

        .item-name {
          flex: 1;
          padding: 0 8px;
        }

        .item-price {
          font-weight: bold;
          text-align: right;
          min-width: 60px;
        }

        .additional {
          font-size: 10px;
          color: #555;
          padding-left: 24px;
          margin-top: 2px;
        }

        .item-obs {
          font-size: 10px;
          color: #666;
          padding-left: 24px;
          margin-top: 4px;
          font-style: italic;
        }

        .totals {
          margin: 12px 0;
          padding-top: 8px;
          border-top: 2px dashed #333;
        }

        .total-line {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
          font-size: 12px;
        }

        .total-line.discount {
          color: #2a9d2a;
        }

        .total-line.final {
          font-size: 16px;
          font-weight: bold;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #333;
        }

        .payment-method {
          text-align: center;
          margin: 12px 0;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .payment-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
        }

        .payment-value {
          font-size: 14px;
          font-weight: bold;
          margin-top: 2px;
        }

        .observations {
          margin: 12px 0;
          padding: 8px;
          background: #fff8dc;
          border-radius: 4px;
          border-left: 3px solid #ffa500;
        }

        .obs-title {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          color: #666;
        }

        .obs-text {
          margin-top: 4px;
          font-size: 12px;
        }

        .footer {
          text-align: center;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 2px dashed #333;
        }

        .thanks {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .comeback {
          font-size: 11px;
          color: #666;
        }

        .establishment-contact {
          font-size: 10px;
          color: #888;
          margin-top: 8px;
        }

        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-name">${establishment.name}</div>
        <div class="order-number">Pedido #${order.order_number}</div>
        <div class="datetime">${formatDate(order.created_at)}</div>
        <div class="delivery-type">${getDeliveryTypeLabel()}</div>
      </div>

      ${order.customer_name || order.customer_phone ? `
        <div class="section">
          <div class="section-title">👤 Cliente</div>
          <div class="customer-info">
            ${order.customer_name ? `<div class="customer-name">${order.customer_name}</div>` : ''}
            ${order.customer_phone ? `<div>📱 ${order.customer_phone}</div>` : ''}
          </div>
        </div>
      ` : ''}

      ${order.delivery_type === 'delivery' || order.delivery_type === 'turbo' ? `
        <div class="section">
          <div class="section-title">📍 Endereço de Entrega</div>
          <div class="address-box">${formatAddress()}</div>
        </div>
      ` : ''}

      <div class="items-section">
        <div class="section-title">📋 Itens do Pedido</div>
        ${itemsHTML}
      </div>

      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        ${order.delivery_fee > 0 ? `
          <div class="total-line">
            <span>Taxa de entrega:</span>
            <span>${formatCurrency(order.delivery_fee)}</span>
          </div>
        ` : ''}
        ${order.discount > 0 ? `
          <div class="total-line discount">
            <span>Desconto:</span>
            <span>-${formatCurrency(order.discount)}</span>
          </div>
        ` : ''}
        <div class="total-line final">
          <span>TOTAL:</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
      </div>

      <div class="payment-method">
        <div class="payment-label">Forma de Pagamento</div>
        <div class="payment-value">${getPaymentMethodLabel()}</div>
      </div>

      ${order.observations ? `
        <div class="observations">
          <div class="obs-title">📝 Observações</div>
          <div class="obs-text">${order.observations}</div>
        </div>
      ` : ''}

      <div class="footer">
        <div class="thanks">Obrigado pela preferência! ❤️</div>
        <div class="comeback">Volte sempre!</div>
        ${establishment.whatsapp || establishment.phone ? `
          <div class="establishment-contact">
            ${establishment.whatsapp ? `WhatsApp: ${establishment.whatsapp}` : ''}
            ${establishment.phone && !establishment.whatsapp ? `Tel: ${establishment.phone}` : ''}
          </div>
        ` : ''}
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
