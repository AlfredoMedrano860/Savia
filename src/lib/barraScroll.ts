import { useEffect, type RefObject } from 'react'

// Barra de scroll propia para contenedores con scroll (los modales). Es la misma que usa
// My Green Farm: una línea delgada que se ensancha al pasar el mouse, se puede arrastrar
// y al tocar la pista salta a ese punto. La barra nativa queda oculta (index.css).
//
// La barra se agrega como primer hijo del contenedor, con posición absoluta, y se mueve
// con el scroll para quedar siempre visible a la derecha.

const MARGEN = 16
const MIN_PULGAR = 24
const MAX_PULGAR = 56

export function useBarraScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const contenedor = ref.current
    if (!contenedor) return

    const pista = document.createElement('div')
    pista.className = 'barra-scroll'
    pista.setAttribute('aria-hidden', 'true')
    const pulgar = document.createElement('div')
    pulgar.className = 'barra-scroll__pulgar'
    pista.appendChild(pulgar)
    contenedor.prepend(pista)

    let altoPulgar = 0
    let altoPista = 0

    const actualizar = () => {
      const { scrollTop, scrollHeight, clientHeight } = contenedor
      const maximo = scrollHeight - clientHeight
      if (maximo <= 1) {
        pista.hidden = true
        return
      }
      pista.hidden = false
      altoPista = clientHeight - MARGEN * 2
      altoPulgar = Math.min(MAX_PULGAR, Math.max(MIN_PULGAR, (altoPista * clientHeight) / scrollHeight))
      pista.style.top = `${scrollTop + MARGEN}px`
      pista.style.height = `${altoPista}px`
      pulgar.style.height = `${altoPulgar}px`
      pulgar.style.transform = `translateY(${(scrollTop / maximo) * (altoPista - altoPulgar)}px)`
    }

    // Arrastrar el pulgar.
    const alPresionarPulgar = (evento: PointerEvent) => {
      evento.preventDefault()
      evento.stopPropagation()
      pulgar.setPointerCapture(evento.pointerId)
      pista.classList.add('is-arrastrando')
      const inicioY = evento.clientY
      const inicioScroll = contenedor.scrollTop
      const proporcion = (contenedor.scrollHeight - contenedor.clientHeight) / Math.max(1, altoPista - altoPulgar)
      const mover = (e: PointerEvent) => {
        contenedor.scrollTop = inicioScroll + (e.clientY - inicioY) * proporcion
      }
      const soltar = () => {
        pista.classList.remove('is-arrastrando')
        pulgar.removeEventListener('pointermove', mover)
        pulgar.removeEventListener('pointerup', soltar)
        pulgar.removeEventListener('pointercancel', soltar)
      }
      pulgar.addEventListener('pointermove', mover)
      pulgar.addEventListener('pointerup', soltar)
      pulgar.addEventListener('pointercancel', soltar)
    }

    // Tocar la pista: salta a ese punto.
    const alPresionarPista = (evento: PointerEvent) => {
      if (evento.target !== pista) return
      evento.preventDefault()
      evento.stopPropagation()
      const desplazamiento = evento.clientY - pista.getBoundingClientRect().top - altoPulgar / 2
      const maximo = contenedor.scrollHeight - contenedor.clientHeight
      contenedor.scrollTo({ top: (desplazamiento / Math.max(1, altoPista - altoPulgar)) * maximo, behavior: 'smooth' })
    }
    const detener = (evento: Event) => evento.stopPropagation()

    pulgar.addEventListener('pointerdown', alPresionarPulgar)
    pista.addEventListener('pointerdown', alPresionarPista)
    pista.addEventListener('click', detener)

    // Se recalcula si cambia el tamaño del contenedor o de su contenido (filtros, "Ver más").
    const observador = new ResizeObserver(actualizar)
    observador.observe(contenedor)
    for (const hijo of Array.from(contenedor.children)) if (hijo !== pista) observador.observe(hijo)
    const mutaciones = new MutationObserver(() => {
      for (const hijo of Array.from(contenedor.children)) if (hijo !== pista) observador.observe(hijo)
      actualizar()
    })
    mutaciones.observe(contenedor, { childList: true, subtree: true })
    contenedor.addEventListener('scroll', actualizar, { passive: true })
    actualizar()

    return () => {
      observador.disconnect()
      mutaciones.disconnect()
      contenedor.removeEventListener('scroll', actualizar)
      pista.remove()
    }
  }, [ref])
}
