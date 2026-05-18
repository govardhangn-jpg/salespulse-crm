// ═══════════════════════════════════════════════════
// MAGMATIC NDT CRM — Service Worker
// Provides offline support and fast loading
// ═══════════════════════════════════════════════════

const CACHE_VERSION = 'magmatic-crm-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;

// Files to cache on install (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/attendance.html',
  '/quotation.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install: cache static assets ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('magmatic-crm-') && k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache, fall back to network ─
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always bypass service worker for API calls — need fresh data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({
          status: 'error',
          message: 'You are offline. Please check your connection.'
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // For navigation requests: network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Update cache with fresh copy
          const copy = response.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached =>
            cached || caches.match('/index.html')
          )
        )
    );
    return;
  }

  // For static assets: cache first, network fallback
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, copy));
        }
        return response;
      });
    })
  );
});

// ── Background sync for offline interactions ───────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-interactions') {
    event.waitUntil(syncPendingInteractions());
  }
});

async function syncPendingInteractions() {
  // Future: sync any queued offline interactions
  console.log('[SW] Background sync triggered');
}

// ── Push notifications ─────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Magmatic NDT CRM', {
      body:    data.body || 'You have a new notification',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
