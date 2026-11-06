import { useSyncExternalStore } from 'react'

/*
 * Savia como app instalable y sin conexión.
 *  - registrarServiceWorker(): guarda el sitio en el teléfono (solo en la versión publicada).
 *  - El evento 'savia:sin-conexion-listo' avisa la primera vez que ya funciona sin internet.
 *  - useInstalable() / instalar(): botón "Instalar Savia" cuando el navegador lo permite.
 */

export const EVENTO_LISTO = 'savia:sin-conexion-listo'
const CLAVE_AVISADO = 'savia:sin-conexion-avisado'

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

/** Registra el service worker y avisa una sola vez cuando el sitio quedó guardado. */
export function registrarServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registro) => {
        const avisarListo = () => {
          try {
            if (localStorage.getItem(CLAVE_AVISADO)) return
            localStorage.setItem(CLAVE_AVISADO, '1')
          } catch {
            return
          }
          window.dispatchEvent(new Event(EVENTO_LISTO))
        }
        if (registro.active) avisarListo()
        registro.addEventListener('updatefound', () => {
          const nuevo = registro.installing
          nuevo?.addEventListener('statechange', () => {
            if (nuevo.state === 'activated') avisarListo()
          })
        })
      })
      .catch((error: unknown) => console.warn('No se pudo activar el modo sin conexión.', error))
  })
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
