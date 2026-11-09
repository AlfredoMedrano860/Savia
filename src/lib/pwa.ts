import { useSyncExternalStore } from 'react'

/*
 * Savia como app instalable.
 *  - useInstalable() / instalar(): botón "Instalar Savia" cuando el navegador lo permite.
 *  - retirarServiceWorker(): Savia ya no funciona sin internet. Quita el service worker y la
 *    copia de archivos que guardaban las versiones anteriores en los navegadores que la visitaron.
 */

interface EventoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let pendiente: EventoInstalar | null = null
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((o) => o())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    pendiente = e as EventoInstalar
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    pendiente = null
    avisar()
  })
}

/** Desinstala el service worker de versiones anteriores y borra su caché y su aviso. */
export function retirarServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker
    .getRegistrations()
    .then((registros) => Promise.all(registros.map((registro) => registro.unregister())))
    .catch(() => {})
  if ('caches' in window) {
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((clave) => clave.startsWith('savia-')).map((clave) => caches.delete(clave))))
      .catch(() => {})
  }
  try {
    localStorage.removeItem('savia:sin-conexion-avisado')
  } catch {
    // sin acceso al almacenamiento: no hay nada que limpiar
  }
}

const suscribir = (o: () => void) => {
  oyentes.add(o)
  return () => oyentes.delete(o)
}

/** `true` cuando el navegador ofrece instalar Savia como app. */
export function useInstalable() {
  return useSyncExternalStore(suscribir, () => pendiente !== null)
}

/** Abre el diálogo del navegador para instalar Savia. */
export async function instalar() {
  if (!pendiente) return
  await pendiente.prompt()
  await pendiente.userChoice
  pendiente = null
  avisar()
}
