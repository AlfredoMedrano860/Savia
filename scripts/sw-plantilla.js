// Service worker de Savia (plantilla). Al compilar, vite.config.ts pone la versión y la lista
// de archivos en las constantes CACHE y ARCHIVOS, y lo publica como sw.js.
//  - Al instalarse guarda todos los archivos del sitio, incluido el banco de preguntas.
//  - Las páginas se piden primero a la red (para tener la versión más nueva) y, sin
//    conexión, se usa la copia guardada.
//  - El resto de archivos (código, estilos, fuentes, imágenes, preguntas) sale del caché.
const CACHE = 'savia-__VERSION__'
const ARCHIVOS = __ARCHIVOS__

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n.startsWith('savia-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone()
          caches.open(CACHE).then((cache) => cache.put('./', copia))
          return respuesta
        })
        .catch(() => caches.match('./')),
    )
    return
  }

  evento.respondWith(
    caches.match(request).then(
      (guardada) =>
        guardada ||
        fetch(request).then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copia))
          }
          return respuesta
        }),
    ),
  )
})
