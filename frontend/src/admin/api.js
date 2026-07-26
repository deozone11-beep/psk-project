export const API = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '/api' : 'https://psk-builders.onrender.com/api');

export function authHeader(auth) {
  return { Authorization: 'Bearer ' + auth.token };
}

export async function api(path, auth, opts = {}) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...authHeader(auth), ...(opts.headers || {}) },
  });
  if (r.status === 401 || r.status === 403) {
    sessionStorage.removeItem('psk_auth');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new Error(body?.message || `Error ${r.status}`);
  }
  if (r.status === 204) return null;
  return r.json();
}
