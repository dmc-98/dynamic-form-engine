const CACHE_NAME = 'dfe-example-v1'
const APP_SHELL = ['/', '/index.html']
const FORM_ROUTE_FRAGMENT = '/api/dfe/forms/'
const OPTIONS_ROUTE_FRAGMENT = '/api/dfe/options/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

function isCacheableGet(request) {
  if (request.method !== 'GET') {
    return false
  }

  const url = new URL(request.url)
  return (
    request.mode === 'navigate'
    || url.pathname === '/'
    || url.pathname.endsWith('/index.html')
    || url.pathname.includes(FORM_ROUTE_FRAGMENT)
    || url.pathname.includes(OPTIONS_ROUTE_FRAGMENT)
  )
}

self.addEventListener('fetch', (event) => {
  if (!isCacheableGet(event.request)) {
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)

    try {
      const response = await fetch(event.request)
      if (response.ok) {
        await cache.put(event.request, response.clone())
      }
      return response
    } catch (error) {
      const cached = await cache.match(event.request)
      if (cached) {
        return cached
      }

      if (event.request.mode === 'navigate') {
        const shell = await cache.match('/index.html')
        if (shell) {
          return shell
        }
      }

      throw error
    }
  })())
})
