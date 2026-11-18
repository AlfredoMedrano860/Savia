import { useSyncExternalStore } from 'react'
import { avisarCambioDeProgreso } from './cambios'

/*
 * El blobatar que la persona eligió para su perfil. Se guarda con el resto del progreso
 * (savia:perfil), así que viaja en el respaldo y se sincroniza con la cuenta. Si no eligió
 * ninguno, se usa el que sale de su correo.
 */
const CLAVE = 'savia:perfil'
const oyentes = new Set<() => void>()

interface PerfilGuardado {
  avatar: string
  actualizado: number
}

function leer(): PerfilGuardado | null {
  try {
    const valor: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    if (valor && typeof valor === 'object' && typeof (valor as PerfilGuardado).avatar === 'string') return valor as PerfilGuardado
  } catch {
    // dato dañado: se usa el blobatar por defecto
  }
  return null
}

let guardado = typeof window === 'undefined' ? null : leer()

/** Semilla del blobatar elegido (null si se usa el de por defecto). */
export function useAvatarElegido() {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o)
      return () => oyentes.delete(o)
    },
    () => guardado?.avatar ?? null,
  )
}

export function elegirAvatar(avatar: string) {
  guardado = { avatar, actualizado: Date.now() }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(guardado))
    avisarCambioDeProgreso()
  } catch {
    // sin almacenamiento: la elección dura hasta recargar
  }
  oyentes.forEach((o) => o())
}

/** Opciones para elegir blobatar: variaciones estables a partir de una base (el correo). */
export const opcionesDeAvatar = (base: string, cantidad = 12) => Array.from({ length: cantidad }, (_, i) => (i === 0 ? base : `${base}#${i}`))
