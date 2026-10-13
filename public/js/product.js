import { api, cart, formatPrice, escapeHTML, toast } from './common.js';

const container = document.querySelector('#product-detail');
const id = new URLSearchParams(location.search).get('id');

async function load() {
  try {
    const { product: p } = await api(`/products/${encodeURIComponent(id)}`);
    document.title = `ShopEase - ${p.name}`;
    const inStock = p.stock > 0;

    container.innerHTML = `
      <section class="detail">
        <img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.name)}" />
        <div>
          <span class="card-category">${escapeHTML(p.category)}</span>
          <h1>${escapeHTML(p.name)}</h1>
          <div class="price">${formatPrice(p.price)}</div>
          <p>${escapeHTML(p.description)}</p>
          <div class="stock ${inStock ? 'in' : 'out'}">${inStock ? `In stock (${p.stock} available)` : 'Out of stock'}</div>
          <div class="qty-row">
            <input id="qty" type="number" min="1" max="${p.stock}" value="1" ${inStock ? '' : 'disabled'} />
            <button id="add-btn" class="btn btn-primary" ${inStock ? '' : 'disabled'}>Add to cart</button>
          </div>
        </div>
      </section>`;

    document.querySelector('#add-btn').addEventListener('click', () => {
      const qty = Math.max(1, Math.min(p.stock, Number(document.querySelector('#qty').value) || 1));
      cart.add(p, qty);
      toast(`${qty} x ${p.name} added to cart`);
    });
  } catch (err) {
    container.innerHTML = `<p class="error-msg">${escapeHTML(err.message)}</p>`;
  }
}

load();
