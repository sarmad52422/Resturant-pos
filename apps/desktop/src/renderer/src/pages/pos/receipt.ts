import type { PosOrder, ReceiptLine } from './interfaces';
import { money } from './formatting';

export function buildReceiptHtml(order: PosOrder, cart: ReceiptLine[], total: number) {
  const rows = cart
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.name)} x ${line.quantity}</td>
          <td style="text-align:right">${money.format(line.price * line.quantity)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; padding: 10px; width: 72mm; font-family: Arial, sans-serif; font-size: 12px; color: #000; }
          h1 { font-size: 18px; margin: 0 0 8px; text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 3px 0; vertical-align: top; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .total { font-size: 16px; font-weight: 700; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <h1>RestaurantOS</h1>
        <p class="center">Order ${escapeHtml(order.orderNumber)}</p>
        ${order.table?.name ? `<p class="center">Table ${escapeHtml(order.table.name)}</p>` : ''}
        ${order.customer?.name ? `<p class="center">${escapeHtml(order.customer.name)}${order.customer.phone ? ` - ${escapeHtml(order.customer.phone)}` : ''}</p>` : ''}
        <div class="line"></div>
        <table>${rows}</table>
        <div class="line"></div>
        <table>
          <tr class="total"><td>Total</td><td style="text-align:right">${money.format(total || Number(order.grandTotal))}</td></tr>
        </table>
        <p class="center">Thank you</p>
      </body>
    </html>
  `;
}

export function buildReceiptText(
  order: Pick<PosOrder, 'customer' | 'grandTotal' | 'orderNumber' | 'table'>,
  cart: ReceiptLine[],
  total: number,
) {
  const rows = cart
    .map((line) => {
      const left = `${line.name} x ${line.quantity}`;
      const right = money.format(line.price * line.quantity);
      return `${left.padEnd(Math.max(1, 32 - right.length), ' ')}${right}`;
    })
    .join('\n');

  return [
    `Order ${order.orderNumber}`,
    order.table?.name ? `Table ${order.table.name}` : undefined,
    order.customer?.name ? `${order.customer.name}${order.customer.phone ? ` - ${order.customer.phone}` : ''}` : undefined,
    '------------------------------',
    rows,
    '------------------------------',
    `Total ${money.format(total || Number(order.grandTotal))}`,
    '',
    'Thank you',
  ].filter(Boolean).join('\n');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
