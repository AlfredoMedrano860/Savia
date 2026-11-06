import { useEffect, useState } from 'react'

export type RutaLegal = 'terminos' | 'privacidad' | 'cookies' | 'licencias'
export type Ruta = 'inicio' | 'practicar' | 'progreso' | 'temario' | 'proyecto' | RutaLegal

export const RUTAS: { id: Ruta; nombre: string; href: string }[] = [
  { id: 'inicio', nombre: 'Inicio', href: '#/' },
  { id: 'practicar', nombre: 'Practicar', href: '#/practicar' },
  { id: 'progreso', nombre: 'Mi progreso', href: '#/progreso' },
  { id: 'temario', nombre: 'Temario', href: '#/temario' },
  { id: 'proyecto', nombre: 'El proyecto', href: '#/proyecto' },
]

// Páginas legales: se enlazan desde el pie de página, no desde el menú principal.
export const RUTAS_LEGALES: { id: RutaLegal; nombre: string; href: string }[] = [
  { id: 'terminos', nombre: 'Términos de uso', href: '#/terminos' },
  { id: 'privacidad', nombre: 'Privacidad', href: '#/privacidad' },
  { id: 'cookies', nombre: 'Cookies y almacenamiento', href: '#/cookies' },
  { id: 'licencias', nombre: 'Licencias y créditos', href: '#/licencias' },
]

const TODAS = [...RUTAS, ...RUTAS_LEGALES]

export const esRutaLegal = (ruta: Ruta): ruta is RutaLegal => RUTAS_LEGALES.some((r) => r.id === ruta)

// Al pasar de un documento legal a otro se reemplaza la entrada del historial en lugar
// de agregar una nueva: así "Regresar" saca de las páginas legales de una sola vez y
// vuelve a donde la persona estaba antes de entrar.
export function abrirLegal(evento: { preventDefault: () => void }, href: string) {
  if (!esRutaLegal(leer())) return
  evento.preventDefault()
  reemplazando = true
  location.replace(href)
}

function leer(): Ruta {
  const id = location.hash.replace(/^#\/?/, '').split('/')[0]
  return TODAS.some((r) => r.id === id) ? (id as Ruta) : 'inicio'
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
  location.hash = TODAS.find((r) => r.id === ruta)!.href
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
// Los cambios entre documentos legales reemplazan la entrada del historial y no cuentan.
let navegaciones = 0
let reemplazando = false
if (typeof window !== 'undefined')
  window.addEventListener('hashchange', () => {
    if (reemplazando) reemplazando = false
    else navegaciones++
  })

export function regresar() {
  if (navegaciones > 0) window.history.back()
  else irA('inicio')
}
