import { api, cart, formatPrice, escapeHTML, toast } from './common.js';

const grid = document.querySelector('#products');
const searchInput = document.querySelector('#search');
const categorySelect = document.querySelector('#category');
let products = [];

async function loadCategories() {
  const { categories } = await api('/products/categories');
  categorySelect.insertAdjacentHTML(
    'beforeend',
    categories.map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(c[0].toUpperCase() + c.slice(1))}</option>`).join('')
  );
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
  if (categorySelect.value) params.set('category', categorySelect.value);

  try {
    ({ products } = await api(`/products?${params}`));
    render();
  } catch (err) {
    grid.innerHTML = `<p class="error-msg">${escapeHTML(err.message)}</p>`;
  }
}

function render() {
  if (products.length === 0) {
    grid.innerHTML = '<p class="empty">No products found.</p>';
    return;
  }
  grid.innerHTML = products
    .map(
      (p) => `
      <article class="card">
        <a href="/product.html?id=${p.id}"><img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.name)}" loading="lazy" /></a>
        <div class="card-body">
          <span class="card-category">${escapeHTML(p.category)}</span>
          <a class="card-title" href="/product.html?id=${p.id}">${escapeHTML(p.name)}</a>
          <div class="card-actions">
            <span class="price">${formatPrice(p.price)}</span>
            <button class="btn btn-primary" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
              ${p.stock === 0 ? 'Sold out' : 'Add to cart'}
            </button>
          </div>
        </div>
      </article>`
    )
    .join('');
}

grid.addEventListener('click', (e) => {
  const id = Number(e.target.dataset.add);
  if (!id) return;
  const product = products.find((p) => p.id === id);
  cart.add(product);
  toast(`${product.name} added to cart`);
});

let debounce;
searchInput.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(loadProducts, 300);
});
categorySelect.addEventListener('change', loadProducts);

loadCategories().catch(() => {});
loadProducts();
