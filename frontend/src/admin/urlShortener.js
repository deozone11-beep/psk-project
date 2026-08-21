const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' : 'https://psk-builders.onrender.com/api');

const PUBLIC_BASE_DOMAIN = 'https://pskbrothers.com';

const urlCache = new Map();

/**
 * Formats a clean public report URL
 */
export function formatPublicReportUrl({ zone = '11', circle = '', id = '', usePublicDomain = true } = {}) {
  const cleanZone = String(zone || '11').replace(/[^0-9a-zA-Z]/g, '');
  const padZone = cleanZone.length === 1 ? '0' + cleanZone : cleanZone;

  let baseOrigin = PUBLIC_BASE_DOMAIN;
  if (!usePublicDomain && typeof window !== 'undefined' && window.location.origin) {
    baseOrigin = window.location.origin;
  } else if (typeof window !== 'undefined' && window.location.hostname && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    baseOrigin = window.location.origin;
  }

  const params = new URLSearchParams();
  params.set('zone', padZone);

  if (circle) {
    const numOnly = String(circle).replace(/[^0-9]/g, '');
    const padCircle = numOnly.padStart(3, '0');
    params.set('circle', padCircle);
  } else if (id) {
    const cleanId = String(id).trim();
    params.set('id', cleanId);
  }

  return `${baseOrigin}/report?${params.toString()}`;
}

/**
 * Shortens a URL using TinyURL proxy with caching and clipboard copying
 * Automatically translates localhost to public production domain so WhatsApp mobile users can open it!
 * @param {string} rawUrl 
 * @returns {Promise<string>} shortUrl
 */
export async function getTinyUrl(rawUrl) {
  if (!rawUrl) return '';

  // Ensure public domain is used for TinyURL (TinyURL rejects localhost)
  let targetUrl = rawUrl;
  if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
    targetUrl = targetUrl.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, PUBLIC_BASE_DOMAIN);
  }

  if (urlCache.has(targetUrl)) {
    return urlCache.get(targetUrl);
  }

  // 1. Try Backend Proxy
  try {
    const res = await fetch(`${API_BASE}/admin/db2/shorten-url?url=${encodeURIComponent(targetUrl)}`);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.shortUrl && data.shortUrl.startsWith('http') && !data.shortUrl.includes('preview/deprecated')) {
        urlCache.set(targetUrl, data.shortUrl);
        return data.shortUrl;
      }
    }
  } catch (e) {
    console.warn('Backend shortener note:', e);
  }

  // 2. Direct TinyURL fetch fallback
  try {
    const directRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`);
    if (directRes.ok) {
      const text = await directRes.text();
      if (text && text.trim().startsWith('http')) {
        const shortUrl = text.trim();
        urlCache.set(targetUrl, shortUrl);
        return shortUrl;
      }
    }
  } catch (e) {
    console.warn('Direct tinyurl note:', e);
  }

  // 3. Fallback to target URL
  urlCache.set(targetUrl, targetUrl);
  return targetUrl;
}

/**
 * Copies TinyURL to clipboard and alerts user
 */
export async function copyTinyUrlToClipboard(longUrl, label = '') {
  const shortUrl = await getTinyUrl(longUrl);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      return { success: true, shortUrl };
    } catch (e) {
      // Prompt fallback
    }
  }
  if (typeof window !== 'undefined') {
    window.prompt(`Copy Short Link${label ? ` (${label})` : ''}:`, shortUrl);
  }
  return { success: true, shortUrl };
}
