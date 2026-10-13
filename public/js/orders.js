import { api, auth, formatPrice, escapeHTML } from './common.js';

const root = document.querySelector('#orders-root');

if (!auth.token) location.href = '/login.html?next=/orders.html';

async function load() {
  try {
    const { orders } = await api('/orders');
    if (orders.length === 0) {
      root.innerHTML = '<div class="panel empty">No orders yet. <a href="/">Start shopping</a></div>';
      return;
    }
    root.innerHTML = orders
      .map(
        (o) => `
        <section class="panel order">
          <div class="order-head">
            <strong>Order #${o.id}</strong>
            <span class="card-category">${new Date(o.created_at + 'Z').toLocaleString()}</span>
            <span class="status">${escapeHTML(o.status)}</span>
          </div>
          ${o.items
            .map(
              (i) => `<div class="order-line"><span>${escapeHTML(i.name)} &times; ${i.quantity}</span><span>${formatPrice(i.unit_price * i.quantity)}</span></div>`
            )
            .join('')}
          <div class="summary-row summary-total"><span>Total</span><span>${formatPrice(o.total)}</span></div>
          <p class="card-category">Ship to: ${escapeHTML(o.shipping_address)}</p>
        </section>`
      )
      .join('');
  } catch (err) {
    root.innerHTML = `<p class="error-msg">${escapeHTML(err.message)}</p>`;
  }
}

load();
