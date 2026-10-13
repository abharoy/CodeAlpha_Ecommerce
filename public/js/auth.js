import { api, auth } from './common.js';

const form = document.querySelector('#auth-form');
const errorEl = document.querySelector('#form-error');
const mode = form.dataset.mode; // "login" | "register"

// Only allow same-site redirects after login.
function nextUrl() {
  const next = new URLSearchParams(location.search).get('next') || '/';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

if (auth.token) location.href = nextUrl();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  errorEl.textContent = '';

  try {
    const body = Object.fromEntries(new FormData(form));
    const session = await api(`/auth/${mode}`, { method: 'POST', body });
    auth.save(session);
    location.href = nextUrl();
  } catch (err) {
    errorEl.textContent = err.message;
    button.disabled = false;
  }
});
