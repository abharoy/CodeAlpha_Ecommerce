import { api, auth, cart, formatPrice, escapeHTML, toast } from './common.js';

const root = document.querySelector('#cart-root');

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

let addresses = [];
let selectedId = null;
let showAddForm = false;

async function loadAddresses() {
  if (!auth.user) return;
  try {
    ({ addresses } = await api('/addresses'));
    if (!addresses.some((a) => a.id === selectedId)) selectedId = addresses[0]?.id ?? null;
    showAddForm = addresses.length === 0;
  } catch (err) {
    toast(err.message, 'error');
  }
}

function addressListHTML() {
  return addresses
    .map(
      (a) => `
      <label class="address-option ${a.id === selectedId ? 'selected' : ''}">
        <input type="radio" name="address" value="${a.id}" ${a.id === selectedId ? 'checked' : ''} />
        <span>
          <strong>${escapeHTML(a.full_name)}</strong> &middot; ${escapeHTML(a.phone)}<br />
          ${escapeHTML(a.line1)}, ${escapeHTML(a.city)}, ${escapeHTML(a.state)} - ${escapeHTML(a.pincode)}
        </span>
        <button type="button" class="btn btn-danger" data-delete-address="${a.id}">Delete</button>
      </label>`
    )
    .join('');
}

function addressFormHTML() {
  return `
    <form id="address-form" class="address-form">
      <div class="field"><label for="a-name">Full name</label><input id="a-name" name="fullName" required /></div>
      <div class="field"><label for="a-phone">Phone</label><input id="a-phone" name="phone" inputmode="numeric" pattern="\\d{10}" maxlength="10" placeholder="10 digits" required /></div>
      <div class="field"><label for="a-line1">House no, street, area</label><input id="a-line1" name="line1" required /></div>
      <div class="field"><label for="a-city">City</label><input id="a-city" name="city" required /></div>
      <div class="field">
        <label for="a-state">State</label>
        <select id="a-state" name="state" required>
          <option value="">Select state</option>
          ${STATES.map((s) => `<option>${s}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label for="a-pin">Pincode</label><input id="a-pin" name="pincode" inputmode="numeric" pattern="\\d{6}" maxlength="6" required /></div>
      <p class="form-error" id="address-error"></p>
      <button class="btn btn-primary btn-block" type="submit">Save address</button>
      ${addresses.length ? '<button class="btn btn-ghost btn-block" type="button" id="cancel-address" style="margin-top: 8px">Cancel</button>' : ''}
    </form>`;
}

function checkoutHTML() {
  if (!auth.user) {
    return `<a class="btn btn-primary btn-block" style="margin-top: 18px; text-align: center" href="/login.html?next=/cart.html">Login to checkout</a>`;
  }
  return `
    <h3 style="margin: 18px 0 10px">Deliver to</h3>
    ${addressListHTML()}
    ${
      showAddForm
        ? addressFormHTML()
        : '<button class="btn btn-ghost btn-block" type="button" id="add-address">+ Add new address</button>'
    }
    <p class="form-error" id="checkout-error" style="margin-top: 12px"></p>
    <button class="btn btn-primary btn-block" id="place-order" ${selectedId ? '' : 'disabled'}>Place Order</button>`;
}

function render() {
  const items = cart.items;
  if (items.length === 0) {
    root.innerHTML = '<div class="panel empty">Your cart is empty. <a href="/">Continue shopping</a></div>';
    return;
  }

  root.innerHTML = `
    <div class="cart-layout">
      <section class="panel">
        ${items
          .map(
            (i) => `
          <div class="cart-item">
            <img src="${escapeHTML(i.imageUrl)}" alt="${escapeHTML(i.name)}" />
            <div>
              <a href="/product.html?id=${i.productId}"><strong>${escapeHTML(i.name)}</strong></a>
              <div class="card-category">${formatPrice(i.price)} each</div>
            </div>
            <input type="number" min="1" value="${i.quantity}" data-qty="${i.productId}" />
            <button class="btn btn-danger" data-remove="${i.productId}">Remove</button>
          </div>`
          )
          .join('')}
      </section>

      <aside class="panel">
        <h2 style="margin-bottom: 14px">Order Summary</h2>
        <div class="summary-row"><span>Items</span><span>${cart.count}</span></div>
        <div class="summary-row summary-total"><span>Total</span><span>${formatPrice(cart.total)}</span></div>
        ${checkoutHTML()}
      </aside>
    </div>`;

  document.querySelector('#address-form')?.addEventListener('submit', saveAddress);
}

async function saveAddress(e) {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const { address } = await api('/addresses', {
      method: 'POST',
      body: Object.fromEntries(new FormData(form)),
    });
    addresses.unshift(address);
    selectedId = address.id;
    showAddForm = false;
    toast('Address saved');
    render();
  } catch (err) {
    form.querySelector('#address-error').textContent = err.message;
    button.disabled = false;
  }
}

async function deleteAddress(id) {
  if (!confirm('Delete this address?')) return;
  try {
    await api(`/addresses/${id}`, { method: 'DELETE' });
    addresses = addresses.filter((a) => a.id !== id);
    if (selectedId === id) selectedId = addresses[0]?.id ?? null;
    if (addresses.length === 0) showAddForm = true;
    render();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function placeOrder(button) {
  const errorEl = document.querySelector('#checkout-error');
  button.disabled = true;
  errorEl.textContent = '';

  try {
    const { orderId } = await api('/orders', {
      method: 'POST',
      body: {
        addressId: selectedId,
        items: cart.items.map(({ productId, quantity }) => ({ productId, quantity })),
      },
    });
    cart.clear();
    toast(`Order #${orderId} placed!`);
    setTimeout(() => (location.href = '/orders.html'), 800);
  } catch (err) {
    errorEl.textContent = err.message;
    button.disabled = false;
  }
}

root.addEventListener('change', (e) => {
  if (e.target.name === 'address') {
    selectedId = Number(e.target.value);
    render();
    return;
  }
  const id = Number(e.target.dataset.qty);
  if (!id) return;
  cart.setQuantity(id, Math.max(1, Number(e.target.value) || 1));
  render();
});

root.addEventListener('click', (e) => {
  const t = e.target;
  if (t.dataset.deleteAddress) {
    e.preventDefault(); // don't let the click select the radio inside the label
    return deleteAddress(Number(t.dataset.deleteAddress));
  }
  if (t.id === 'add-address') {
    showAddForm = true;
    return render();
  }
  if (t.id === 'cancel-address') {
    showAddForm = false;
    return render();
  }
  if (t.id === 'place-order') return placeOrder(t);

  const id = Number(t.dataset.remove);
  if (!id) return;
  cart.remove(id);
  render();
});

render();
loadAddresses().then(render);
