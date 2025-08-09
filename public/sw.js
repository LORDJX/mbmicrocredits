/* simple PWA service worker: cache app shell and enable offline */
const CACHE_NAME = "mb-microcredits-cache-v1"
const APP_SHELL = ["/mobile", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  // Cache-first for navigation and static assets; network-first for API calls
  const isAPI = request.url.includes("/api/")
  if (isAPI) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => cached)
      return cached || networkFetch
    }),
  )
})
