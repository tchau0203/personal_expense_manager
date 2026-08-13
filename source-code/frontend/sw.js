/* ================================================================
   sw.js — Service Worker (Phase 4 PWA)
   Strategy:
   - App Shell (HTML/CSS/JS) → Cache First
   - API calls (/api/) → Network First, fallback to cache
   - Offline fallback for navigation
   ================================================================ */

const CACHE_VERSION = 'v4.0.0';
const SHELL_CACHE   = `shell-${CACHE_VERSION}`;
const DATA_CACHE    = `data-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
];

// ── Install: pre-cache shell assets ─────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      console.log('[SW] Pre-caching shell assets');
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ───────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== DATA_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategy ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET & cross-origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // API calls → Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // Shell assets → Cache First
  if (
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(networkFirst(request, SHELL_CACHE));
});

// ── Strategy: Cache First ────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback
    const fallback = await cache.match('/');
    return fallback || new Response('Offline — vui lòng kết nối internet', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// ── Strategy: Network First ──────────────────────────────────────
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(
      JSON.stringify({ error: 'Offline — không thể kết nối tới máy chủ' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Background Sync: Offline queue (Phase 4+) ────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-expenses') {
    console.log('[SW] Background sync: syncing queued expenses...');
    // Future: implement IndexedDB queue processing
  }
});
