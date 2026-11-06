import { useEffect, useState } from 'react'

export type Ruta = 'inicio' | 'practicar' | 'progreso' | 'temario' | 'proyecto'

export const RUTAS: { id: Ruta; nombre: string; href: string }[] = [
  { id: 'inicio', nombre: 'Inicio', href: '#/' },
  { id: 'practicar', nombre: 'Practicar', href: '#/practicar' },
  { id: 'progreso', nombre: 'Mi progreso', href: '#/progreso' },
  { id: 'temario', nombre: 'Temario', href: '#/temario' },
  { id: 'proyecto', nombre: 'El proyecto', href: '#/proyecto' },
]

function leer(): Ruta {
  const id = location.hash.replace(/^#\/?/, '').split('/')[0]
  return RUTAS.some((r) => r.id === id) ? (id as Ruta) : 'inicio'
}

// Enlace a un tema del temario, con el subtema resaltado (#/temario/T22/Genética).
export function enlaceTemario(tema: string, subtema?: string) {
  return `#/temario/${tema}${subtema ? `/${encodeURIComponent(subtema)}` : ''}`
}

// Tema y subtema pedidos en la dirección del temario, si los hay.
export function destinoTemario(): { tema: string; subtema: string | null } | null {
  const [ruta, tema, subtema] = location.hash.replace(/^#\/?/, '').split('/')
  if (ruta !== 'temario' || !tema) return null
  return { tema, subtema: subtema ? decodeURIComponent(subtema) : null }
}

export function irA(ruta: Ruta) {
  location.hash = RUTAS.find((r) => r.id === ruta)!.href
}

export function useRuta() {
  const [ruta, setRuta] = useState(leer)
  useEffect(() => {
    const onCambio = () => {
      setRuta(leer())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onCambio)
    return () => window.removeEventListener('hashchange', onCambio)
  }, [])
  return ruta
}

// Cuántas veces se navegó dentro del sitio en esta pestaña: si es cero, se entró directo
// a la página actual y "regresar" no debe sacar a la persona de Savia.
let navegaciones = 0
if (typeof window !== 'undefined') window.addEventListener('hashchange', () => navegaciones++)

export function regresar() {
  if (navegaciones > 0) window.history.back()
  else irA('inicio')
}
