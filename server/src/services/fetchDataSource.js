/**
 * Performs a single HTTP fetch for a DataSource and returns
 * { data, status, error } without mutating the document.
 *
 * Hardens against Server-Side Request Forgery (SSRF):
 *   - Only http: / https: schemes allowed
 *   - Hostname must resolve to a public IP (private, loopback, link-local,
 *     and cloud-metadata addresses are rejected)
 *   - Each redirect hop is re-validated (mitigates DNS-rebinding)
 *
 * Uses Node's built-in fetch (Node 18+).
 */
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');

const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB hard cap on response body

/** Returns true if the given hostname resolves to an IP we won't fetch. */
async function isHostBlocked(hostname) {
  // Reject literal IPs that are private/internal up front.
  if (ipaddr.isValid(hostname) && isInternalIp(hostname)) return true;
  if (ipaddr.IPv6.isValid(hostname) && isInternalIp(hostname)) return true;

  // Resolve and check each result. `dns.lookup` honors /etc/hosts and the
  // OS resolver, which is what fetch() will end up using.
  let addrs;
  try {
    addrs = await dns.lookup(hostname, { all: true });
  } catch {
    return true; // DNS failure → safest to block
  }
  return addrs.some((a) => isInternalIp(a.address));
}

function isInternalIp(addr) {
  let parsed;
  try { parsed = ipaddr.parse(addr); } catch { return true; }
  const range = parsed.range();
  // Block: loopback, private, link-local, carrier-grade NAT, unspecified,
  // multicast, broadcast, reserved, and the cloud-metadata pinhole.
  const blocked = new Set([
    'unspecified', 'broadcast', 'loopback', 'linkLocal', 'carrierGradeNat',
    'private', 'reserved', 'multicast', 'uniqueLocal',
  ]);
  if (blocked.has(range)) return true;

  // Extra: AWS / GCP / Azure metadata service.
  if (parsed.kind() === 'ipv4') {
    const [a, b] = parsed.octets;
    if (a === 169 && b === 254) return true; // 169.254.0.0/16
    if (a === 0) return true;
  }
  return false;
}

function validateUrl(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch {
    return { ok: false, error: 'URL is not valid' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, error: `Only http:// or https:// URLs are allowed (got ${u.protocol})` };
  }
  if (!u.hostname) return { ok: false, error: 'URL must include a hostname' };
  // Strip user:pass from URL (we don't honour them and they can be abused)
  if (u.username || u.password) {
    return { ok: false, error: 'URLs with embedded credentials are not allowed' };
  }
  return { ok: true, url: u };
}

async function fetchOnce(ds, { timeoutMs = 15000 } = {}) {
  const v = validateUrl(ds.url);
  if (!v.ok) return { status: 'error', error: v.error, data: null };

  let currentUrl = v.url;
  let redirects = 0;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    while (true) {
      if (await isHostBlocked(currentUrl.hostname)) {
        return {
          status: 'error',
          error: `Refused to fetch from ${currentUrl.hostname}: address is on a private, loopback, or metadata range.`,
          data: null,
        };
      }

      const init = {
        method: ds.method || 'GET',
        headers: ds.headers && typeof ds.headers === 'object' ? { ...ds.headers } : {},
        signal: controller.signal,
        redirect: 'manual',
      };
      if (ds.method === 'POST' && ds.body != null) {
        if (typeof ds.body === 'string') {
          init.body = ds.body;
        } else {
          init.body = JSON.stringify(ds.body);
          if (!init.headers['Content-Type']) init.headers['Content-Type'] = 'application/json';
        }
      }

      const res = await fetch(currentUrl, init);

      // Handle redirects ourselves so we can re-validate the next hop.
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        if (++redirects > MAX_REDIRECTS) {
          return { status: 'error', error: `Too many redirects (max ${MAX_REDIRECTS})`, data: null };
        }
        let next;
        try { next = new URL(res.headers.get('location'), currentUrl); } catch {
          return { status: 'error', error: 'Redirect target was not a valid URL', data: null };
        }
        const nv = validateUrl(next.toString());
        if (!nv.ok) return { status: 'error', error: `Redirect blocked: ${nv.error}`, data: null };
        currentUrl = nv.url;
        continue;
      }

      // Read body with size cap.
      const reader = res.body?.getReader();
      let bytes = 0;
      const chunks = [];
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > MAX_BODY_BYTES) {
            try { await reader.cancel(); } catch {}
            return { status: 'error', error: `Response too large (>${MAX_BODY_BYTES / 1024 / 1024} MB)`, data: null };
          }
          chunks.push(value);
        }
      }
      const text = Buffer.concat(chunks).toString('utf-8');

      let payload = text;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') || isJsonish(text)) {
        try { payload = JSON.parse(text); } catch { /* leave as text */ }
      }

      if (!res.ok) {
        return { status: 'error', error: `HTTP ${res.status} ${res.statusText}`, data: payload };
      }
      return { status: 'success', error: '', data: payload };
    }
  } catch (err) {
    return {
      status: 'error',
      error: err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || 'Fetch failed'),
      data: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

function isJsonish(text) {
  const t = (text || '').trim();
  return t.startsWith('{') || t.startsWith('[');
}

const PROTO_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Drill into a payload using a dot-path. Refuses to descend through
 * prototype-chain keys.
 */
function applyDataPath(payload, dataPath) {
  if (!dataPath || payload == null) return payload;
  const parts = dataPath.split('.').map((p) => p.trim()).filter(Boolean);
  let cur = payload;
  for (const p of parts) {
    if (cur == null) return cur;
    if (PROTO_KEYS.has(p)) return undefined;
    cur = cur[p];
  }
  return cur;
}

module.exports = { fetchOnce, applyDataPath, validateUrl, isHostBlocked };
