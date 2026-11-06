import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Ruta } from '../lib/ruta'
import adn from '../assets/bocetos/adn.svg'
import celula from '../assets/bocetos/celula.svg'
import frasco from '../assets/bocetos/frasco.svg'
import gafas from '../assets/bocetos/gafas.svg'
import gotero from '../assets/bocetos/gotero.svg'
import guantes from '../assets/bocetos/guantes.svg'
import hoja from '../assets/bocetos/hoja.svg'
import libro from '../assets/bocetos/libro.svg'
import matraz from '../assets/bocetos/matraz.svg'
import microscopio from '../assets/bocetos/microscopio.svg'
import molecula from '../assets/bocetos/molecula.svg'
import petri from '../assets/bocetos/petri.svg'
import tubo from '../assets/bocetos/tubo.svg'
import tubos from '../assets/bocetos/tubos.svg'
import vaso from '../assets/bocetos/vaso.svg'

// Bocetos de biología a lápiz (vectorizados), al fondo de la página y solo como
// decoración: se ubican únicamente en los espacios en blanco.

// Bocetos a lápiz vectorizados.
const lapiz = (src: string) =>
  function BocetoLapiz() {
    return <image href={src} x={10} y={4} width={180} height={192} preserveAspectRatio="xMidYMid meet" />
  }

const Microscopio = lapiz(microscopio)
const MatrazLapiz = lapiz(matraz)
const Tubos = lapiz(tubos)
const Petri = lapiz(petri)
const AdnLapiz = lapiz(adn)
const CelulaLapiz = lapiz(celula)
const Gotero = lapiz(gotero)
const Vaso = lapiz(vaso)
const Gafas = lapiz(gafas)
const Molecula = lapiz(molecula)
const Guantes = lapiz(guantes)
const Frasco = lapiz(frasco)
const Tubo = lapiz(tubo)
const HojaLapiz = lapiz(hoja)
const Libro = lapiz(libro)

const DIBUJOS = [Microscopio, MatrazLapiz, Tubos, Petri, AdnLapiz, CelulaLapiz, Gotero, Vaso, Gafas, Molecula, Guantes, Frasco, Tubo, HojaLapiz, Libro]

// Cada página arranca la serie en un dibujo distinto, para que no se repitan iguales.
const INICIO_POR_RUTA: Record<Ruta, number> = { inicio: 0, practicar: 2, progreso: 3, temario: 4, proyecto: 6 }

// ---------------------------------------------------------------------------
// Ubicación: los dibujos solo van en espacios en blanco
// ---------------------------------------------------------------------------

interface Lugar {
  x: number
  y: number
  tam: number
  giro: number
}

const CELDA = 12
const ALTO_FRANJA = 420
const SEPARACION = 16
const TAGS_OCUPAN = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'IFRAME'])

const transparente = (color: string) => color === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(color)

// ¿El elemento tapa lo que hay detrás (fondo, borde, sombra) o tiene contenido propio?
function ocupaEspacio(el: Element, cs: CSSStyleDeclaration) {
  if (TAGS_OCUPAN.has(el.tagName.toUpperCase())) return true
  if (!transparente(cs.backgroundColor) || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none') return true
  if (parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) > 0 && cs.borderTopStyle !== 'none') return true
  return Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
}

function calcularLugares(raiz: HTMLElement, capa: HTMLElement): Lugar[] {
  const origen = raiz.getBoundingClientRect()
  const ancho = raiz.clientWidth
  const alto = raiz.scrollHeight
  const cols = Math.ceil(ancho / CELDA)
  const filas = Math.ceil(alto / CELDA)
  if (!cols || !filas) return []
  const ocupado = new Uint8Array(cols * filas)

  const marcar = (x0: number, y0: number, x1: number, y1: number) => {
    const c0 = Math.max(0, Math.floor(x0 / CELDA))
    const c1 = Math.min(cols, Math.ceil(x1 / CELDA))
    const f0 = Math.max(0, Math.floor(y0 / CELDA))
    const f1 = Math.min(filas, Math.ceil(y1 / CELDA))
    for (let f = f0; f < f1; f++) ocupado.fill(1, f * cols + c0, f * cols + c1)
  }

  for (const el of raiz.querySelectorAll('*')) {
    if (capa.contains(el)) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.opacity === '0' || !ocupaEspacio(el, cs)) continue
    marcar(r.left - origen.left - SEPARACION, r.top - origen.top - SEPARACION, r.right - origen.left + SEPARACION, r.bottom - origen.top + SEPARACION)
  }

  // Tabla de sumas: saber en O(1) si un cuadrado de la grilla está libre.
  const ancho1 = cols + 1
  const suma = new Uint32Array(ancho1 * (filas + 1))
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      suma[(f + 1) * ancho1 + c + 1] = ocupado[f * cols + c] + suma[f * ancho1 + c + 1] + suma[(f + 1) * ancho1 + c] - suma[f * ancho1 + c]
    }
  }
  const libre = (c: number, f: number, n: number) =>
    suma[(f + n) * ancho1 + c + n] - suma[f * ancho1 + c + n] - suma[(f + n) * ancho1 + c] + suma[f * ancho1 + c] === 0

  const tam = Math.round(Math.min(130, Math.max(90, ancho * 0.075)))
  const n = Math.ceil(tam / CELDA)
  const lugares: Lugar[] = []
  let fondoAnterior = -Infinity

  // Una franja vertical a la vez, alternando el lado preferido.
  for (let y0 = 0, i = 0; y0 < alto; y0 += ALTO_FRANJA, i++) {
    const izquierda = i % 2 === 0
    const centro = y0 + ALTO_FRANJA / 2
    let mejor: { c: number; f: number; puntaje: number } | null = null
    const fDesde = Math.max(Math.floor(y0 / CELDA), Math.ceil((fondoAnterior + 40) / CELDA))
    const fHasta = Math.min(filas - n, Math.floor((y0 + ALTO_FRANJA) / CELDA))
    for (let f = fDesde; f <= fHasta; f++) {
      for (let c = 1; c <= cols - n - 1; c++) {
        if (!libre(c, f, n)) continue
        const x = c * CELDA + tam / 2
        const lado = izquierda ? x : ancho - x
        const puntaje = Math.abs(f * CELDA + tam / 2 - centro) + lado * 0.6 + (lado > ancho / 2 ? 400 : 0)
        if (!mejor || puntaje < mejor.puntaje) mejor = { c, f, puntaje }
      }
    }
    if (!mejor) continue
    lugares.push({ x: mejor.c * CELDA, y: mejor.f * CELDA, tam, giro: ((lugares.length * 37) % 14) - 7 })
    fondoAnterior = mejor.f * CELDA + tam
  }
  return lugares
}

export function Bocetos({ ruta }: { ruta: Ruta | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const [lugares, setLugares] = useState<Lugar[]>([])
  const inicio = ruta ? INICIO_POR_RUTA[ruta] : 1

  // Se recalcula al cambiar de página, de tamaño de ventana o de alto del contenido.
  useEffect(() => {
    const capa = ref.current
    const raiz = capa?.parentElement
    if (!capa || !raiz) return
    let espera = 0
    const recalcular = () => {
      window.clearTimeout(espera)
      espera = window.setTimeout(() => setLugares(calcularLugares(raiz, capa)), 150)
    }
    const observador = new ResizeObserver(recalcular)
    observador.observe(raiz)
    window.addEventListener('resize', recalcular)
    void document.fonts?.ready.then(recalcular)
    recalcular()
    return () => {
      window.clearTimeout(espera)
      observador.disconnect()
      window.removeEventListener('resize', recalcular)
    }
  }, [inicio])

  return (
    <div ref={ref} className="bocetos" aria-hidden="true">
      {lugares.map((lugar, i) => {
        const Dibujo = DIBUJOS[(inicio + i) % DIBUJOS.length]
        const estilo = {
          left: lugar.x,
          top: lugar.y,
          width: lugar.tam,
          '--giro': `${lugar.giro}deg`,
        } as CSSProperties
        return (
          <svg key={`${inicio}-${i}`} className="boceto" viewBox="0 0 200 200" style={estilo} focusable="false">
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <Dibujo />
            </g>
          </svg>
        )
      })}
    </div>
  )
}
