// Shared helpers: API calls, auth session, cart (localStorage), header.

const TOKEN_KEY = 'shop_token';
const USER_KEY = 'shop_user';
const CART_KEY = 'shop_cart';

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export const auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get user() {
    return readJSON(USER_KEY, null);
  },
  save({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && auth.token) auth.logout();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Cart items: [{ productId, name, price, imageUrl, quantity }]
export const cart = {
  get items() {
    return readJSON(CART_KEY, []);
  },
  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge();
  },
  add(product, quantity = 1) {
    const items = this.items;
    const existing = items.find((i) => i.productId === product.id);
    if (existing) existing.quantity += quantity;
    else items.push({ productId: product.id, name: product.name, price: product.price, imageUrl: product.image_url, quantity });
    this.save(items);
  },
  setQuantity(productId, quantity) {
    const items = this.items
      .map((i) => (i.productId === productId ? { ...i, quantity } : i))
      .filter((i) => i.quantity > 0);
    this.save(items);
  },
  remove(productId) {
    this.save(this.items.filter((i) => i.productId !== productId));
  },
  clear() {
    this.save([]);
  },
  get count() {
    return this.items.reduce((n, i) => n + i.quantity, 0);
  },
  get total() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },
};

export const formatPrice = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function updateCartBadge() {
  const badge = document.querySelector('#cart-count');
  if (badge) badge.textContent = cart.count;
}

function renderHeader() {
  const header = document.querySelector('#site-header');
  if (!header) return;
  const user = auth.user;
  header.innerHTML = `
    <nav class="nav container">
      <a href="/" class="logo">ShopEase</a>
      <div class="nav-links">
        <a href="/">Products</a>
        ${user ? '<a href="/orders.html">My Orders</a>' : ''}
        <a href="/cart.html" class="cart-link">Cart <span id="cart-count" class="badge">0</span></a>
        ${
          user
            ? `<span class="hello">Hi, ${escapeHTML(user.name.split(' ')[0])}</span><button id="logout-btn" class="btn btn-ghost">Logout</button>`
            : '<a href="/login.html" class="btn btn-primary">Login</a>'
        }
      </div>
    </nav>`;
  document.querySelector('#logout-btn')?.addEventListener('click', () => {
    auth.logout();
    location.href = '/';
  });
  updateCartBadge();
}

renderHeader();
