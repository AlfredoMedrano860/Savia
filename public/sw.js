// Savia ya no funciona sin internet. Los navegadores que tenían instalado el service worker
// anterior lo cambian por este, que borra la copia guardada del sitio y se desinstala.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const claves = await caches.keys()
      await Promise.all(claves.filter((clave) => clave.startsWith('savia-')).map((clave) => caches.delete(clave)))
      await self.registration.unregister()
      const ventanas = await self.clients.matchAll({ type: 'window' })
      ventanas.forEach((ventana) => ventana.navigate(ventana.url))
    })(),
  )
})
