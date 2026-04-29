/**
 * MVP Safety Service Worker
 *
 * This is a minimal cleanup service worker intended for the MVP launch.
 * It provides NO runtime caching and intentionally clears all existing
 * Cache Storage caches from this origin to prevent any stale assets
 * (HTML, CSS, JS, images, fonts, components, etc.) from being served to users.
 *
 * It can be replaced later with a versioned cache strategy once the
 * site stabilizes.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
  );
});