import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { XIcon } from '@animateicons/react/lucide'
import { useIconosAnimados } from '../lib/useIconosAnimados'

type TamanoTexto = 'normal' | 'grande' | 'muy-grande' | 'maximo'
type ModoColor =
  | 'normal'
  | 'monocromo'
  | 'saturacion-baja'
  | 'saturacion-alta'
  | 'calido'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'

type AjustesAccesibilidad = {
  tamano: TamanoTexto
  color: ModoColor
  contraste: boolean
  resaltarEnlaces: boolean
  fuenteDislexia: boolean
  espacioTexto: boolean
  renglonCorto: boolean
  cursorGrande: boolean
  guiaLectura: boolean
  mascaraLectura: boolean
  reducirMovimiento: boolean
  resaltarEncabezados: boolean
  ocultarDecoracion: boolean
  focoVisible: boolean
  alinearIzquierda: boolean
  lectorVoz: boolean
  leerAlClic: boolean
  leerAlEnfocar: boolean
}

type AjusteBooleano = Exclude<keyof AjustesAccesibilidad, 'tamano' | 'color'>

const CLAVE = 'savia:accesibilidad'
const INICIAL: AjustesAccesibilidad = {
  tamano: 'normal',
  color: 'normal',
  contraste: false,
  resaltarEnlaces: false,
  fuenteDislexia: false,
  espacioTexto: false,
  renglonCorto: false,
  cursorGrande: false,
  guiaLectura: false,
  mascaraLectura: false,
  reducirMovimiento: false,
  resaltarEncabezados: false,
  ocultarDecoracion: false,
  focoVisible: false,
  alinearIzquierda: false,
  lectorVoz: false,
  leerAlClic: true,
  leerAlEnfocar: true,
}

const MODOS_COLOR: { valor: ModoColor; nombre: string }[] = [
  { valor: 'normal', nombre: 'Natural' },
  { valor: 'monocromo', nombre: 'Monocromo' },
  { valor: 'saturacion-baja', nombre: 'Suave' },
  { valor: 'saturacion-alta', nombre: 'Intenso' },
  { valor: 'calido', nombre: 'Cálido' },
  { valor: 'protanopia', nombre: 'Protanopia' },
  { valor: 'deuteranopia', nombre: 'Deuteranopia' },
  { valor: 'tritanopia', nombre: 'Tritanopia' },
]

const FILTROS_DALTONISMO: Record<string, string> = {
  protanopia: '1 0 0 0 0  .4789 .4769 .0442 0 0  .5973 -.6887 1.0914 0 0  0 0 0 1 0',
  deuteranopia: '1.4366 -.6314 .1948 0 0  0 1 0 0 0  -.1842 .1863 .9979 0 0  0 0 0 1 0',
  tritanopia: '.7412 -.4072 .666 0 0  .0751 .5852 .3397 0 0  0 0 1 0 0  0 0 0 1 0',
}

function cargarAjustes(): AjustesAccesibilidad {
  try {
    const guardados: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? '{}')
    if (typeof guardados !== 'object' || guardados === null) return { ...INICIAL }
    const valor = guardados as Partial<AjustesAccesibilidad>
    const tamano = valor.tamano
    const color = valor.color
    return {
      tamano:
        tamano === 'normal' || tamano === 'grande' || tamano === 'muy-grande' || tamano === 'maximo' ? tamano : 'normal',
      color: MODOS_COLOR.some((modo) => modo.valor === color) ? (color as ModoColor) : 'normal',
      contraste: valor.contraste === true,
      resaltarEnlaces: valor.resaltarEnlaces === true,
      fuenteDislexia: valor.fuenteDislexia === true,
      espacioTexto: valor.espacioTexto === true,
      renglonCorto: valor.renglonCorto === true,
      cursorGrande: valor.cursorGrande === true,
      guiaLectura: valor.guiaLectura === true,
      mascaraLectura: valor.mascaraLectura === true,
      reducirMovimiento: valor.reducirMovimiento === true,
      resaltarEncabezados: valor.resaltarEncabezados === true,
      ocultarDecoracion: valor.ocultarDecoracion === true,
      focoVisible: valor.focoVisible === true,
      alinearIzquierda: valor.alinearIzquierda === true,
      lectorVoz: valor.lectorVoz === true,
      leerAlClic: valor.leerAlClic !== false,
      leerAlEnfocar: valor.leerAlEnfocar !== false,
    }
  } catch (error: unknown) {
    console.warn('No se pudieron cargar las preferencias de accesibilidad.', error)
    return { ...INICIAL }
  }
}

// Símbolo universal de accesibilidad: persona con los brazos abiertos.
function IconoAccesibilidad() {
  return (
    <svg className="icono-accesibilidad" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="4.4" r="2.2" fill="currentColor" stroke="none" />
      <path
        d="M4.5 8.6 12 10l7.5-1.4M12 10v4.8m0 0-3.4 6M12 14.8l3.4 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconoCerrar() {
  const animados = useIconosAnimados()
  return (
    <XIcon size={20} isAnimated={animados} aria-hidden="true" />
  )
}

function Opcion({
  ajuste,
  nombre,
  ayuda,
  deshabilitada = false,
  valor,
  onChange,
}: {
  ajuste: boolean
  nombre: string
  ayuda?: string
  deshabilitada?: boolean
  valor: string
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ajuste}
      disabled={deshabilitada}
      className={`accesibilidad__opcion ${ajuste ? 'is-activa' : ''}`}
      onClick={onChange}
    >
      <span className="accesibilidad__opcion-texto">
        <span>{nombre}</span>
        {ayuda && <span className="accesibilidad__ayuda">{ayuda}</span>}
      </span>
      <span className="accesibilidad__estado" aria-hidden="true">
        {valor}
      </span>
    </button>
  )
}

// Sigue la altura del cursor, del dedo o del elemento con foco y la deja en --guia-y.
function useAlturaLectura() {
  const capa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const elemento = capa.current
    if (!elemento) return
    const fijar = (y: number) => elemento.style.setProperty('--guia-y', `${y}px`)
    fijar(window.innerHeight / 2)
    const alMover = (evento: PointerEvent) => fijar(evento.clientY)
    const alEnfocar = (evento: FocusEvent) => {
      if (!(evento.target instanceof Element) || evento.target.closest('[data-a11y-ui]')) return
      const caja = evento.target.getBoundingClientRect()
      fijar(caja.top + caja.height / 2)
    }
    window.addEventListener('pointermove', alMover, { passive: true })
    window.addEventListener('pointerdown', alMover, { passive: true })
    window.addEventListener('focusin', alEnfocar)
    return () => {
      window.removeEventListener('pointermove', alMover)
      window.removeEventListener('pointerdown', alMover)
      window.removeEventListener('focusin', alEnfocar)
    }
  }, [])

  return capa
}

// Regla: una franja del alto de un renglón para no perder la línea.
function GuiaLectura() {
  const capa = useAlturaLectura()
  return (
    <div ref={capa} className="guia-lectura" aria-hidden="true" data-a11y-ui="">
      <span className="guia-lectura__linea" />
    </div>
  )
}

// Máscara: oscurece toda la pantalla menos una ventana de unos tres renglones.
function MascaraLectura() {
  const capa = useAlturaLectura()
  return (
    <div ref={capa} className="mascara-lectura" aria-hidden="true" data-a11y-ui="">
      <span className="mascara-lectura__superior" />
      <span className="mascara-lectura__ventana" />
      <span className="mascara-lectura__inferior" />
    </div>
  )
}

export function Accesibilidad() {
  const [ajustes, setAjustes] = useState(cargarAjustes)
  const [abierto, setAbierto] = useState(false)
  // El panel no existe en la página hasta la primera vez que se abre; desde entonces se
  // queda montado para poder animar también el cierre (como el menú de Noctivulp).
  const [montado, setMontado] = useState(false)
  const alternarPanel = () => {
    if (montado) return setAbierto((estado) => !estado)
    setMontado(true)
    // un cuadro cerrado para que la entrada se anime
    requestAnimationFrame(() => requestAnimationFrame(() => setAbierto(true)))
  }
  const [leyendo, setLeyendo] = useState(false)
  const [estadoLector, setEstadoLector] = useState('')
  const raiz = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const cerrar = useRef<HTMLButtonElement>(null)
  const sesionLector = useRef(0)
  const elementoLeido = useRef<Element | null>(null)
  const compatible = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    const html = document.documentElement
    html.dataset.a11yFont = ajustes.tamano
    html.dataset.a11yColor = ajustes.color
    html.classList.toggle('a11y-contrast', ajustes.contraste)
    html.classList.toggle('a11y-links', ajustes.resaltarEnlaces)
    html.classList.toggle('a11y-dyslexia', ajustes.fuenteDislexia)
    html.classList.toggle('a11y-spacing', ajustes.espacioTexto)
    html.classList.toggle('a11y-big-cursor', ajustes.cursorGrande)
    html.classList.toggle('a11y-reading-guide', ajustes.guiaLectura)
    html.classList.toggle('a11y-reduce-motion', ajustes.reducirMovimiento)
    html.classList.toggle('a11y-headings', ajustes.resaltarEncabezados)
    html.classList.toggle('a11y-hide-decor', ajustes.ocultarDecoracion)
    html.classList.toggle('a11y-focus', ajustes.focoVisible)
    html.classList.toggle('a11y-align-left', ajustes.alinearIzquierda)
    html.classList.toggle('a11y-short-line', ajustes.renglonCorto)
    try {
      if (JSON.stringify(ajustes) === JSON.stringify(INICIAL)) localStorage.removeItem(CLAVE)
      else localStorage.setItem(CLAVE, JSON.stringify(ajustes))
    } catch (error: unknown) {
      console.warn('No se pudieron guardar las preferencias de accesibilidad.', error)
    }
  }, [ajustes])

  useEffect(() => {
    if (!abierto) return
    cerrar.current?.focus({ preventScroll: true })
    const onKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        setAbierto(false)
        boton.current?.focus()
        return
      }
      if (evento.key !== 'Tab' || !raiz.current) return
      const interactivos = raiz.current.querySelectorAll<HTMLElement>(
        '.accesibilidad__panel button:not(:disabled), .accesibilidad__panel input:not(:disabled)',
      )
      const primero = interactivos[0]
      const ultimo = interactivos[interactivos.length - 1]
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo?.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero?.focus()
      }
    }
    const onPointerDown = (evento: PointerEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false)
    }
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [abierto])

  const actualizar = (cambio: Partial<AjustesAccesibilidad>) => {
    setAjustes((actuales) => ({ ...actuales, ...cambio }))
  }

  const alternar = (clave: AjusteBooleano) => {
    setAjustes((actuales) => ({ ...actuales, [clave]: !actuales[clave] }))
  }

  const detenerLectura = useCallback(() => {
    sesionLector.current += 1
    if (compatible) window.speechSynthesis.cancel()
    elementoLeido.current?.classList.remove('a11y-lectura-activa')
    elementoLeido.current = null
    setLeyendo(false)
  }, [compatible])

  const leerPartes = useCallback((partes: { elemento: Element | null; texto: string }[]) => {
    if (!compatible) {
      setEstadoLector('Este navegador no tiene lectura por voz.')
      return
    }
    const validas = partes.map((parte) => ({ ...parte, texto: parte.texto.replace(/\s+/g, ' ').trim() })).filter((parte) => parte.texto)
    if (validas.length === 0) {
      setEstadoLector('No hay texto disponible para leer.')
      return
    }
    detenerLectura()
    const id = sesionLector.current
    setEstadoLector('Leyendo en voz alta…')
    setLeyendo(true)
    const siguiente = (indice: number) => {
      if (id !== sesionLector.current) return
      const parte = validas[indice]
      if (!parte) {
        elementoLeido.current?.classList.remove('a11y-lectura-activa')
        elementoLeido.current = null
        setLeyendo(false)
        setEstadoLector('Lectura terminada.')
        return
      }
      const frase = new SpeechSynthesisUtterance(parte.texto)
      frase.lang = document.documentElement.lang === 'en' ? 'en-US' : 'es-CR'
      frase.onstart = () => {
        if (id !== sesionLector.current) return
        elementoLeido.current?.classList.remove('a11y-lectura-activa')
        elementoLeido.current = parte.elemento
        parte.elemento?.classList.add('a11y-lectura-activa')
        const caja = parte.elemento?.getBoundingClientRect()
        if (caja && (caja.top < 0 || caja.bottom > window.innerHeight)) {
          parte.elemento?.scrollIntoView({ block: 'center', behavior: ajustes.reducirMovimiento ? 'auto' : 'smooth' })
        }
      }
      frase.onend = () => siguiente(indice + 1)
      frase.onerror = (evento) => {
        if (id !== sesionLector.current) return
        if (evento.error !== 'canceled' && evento.error !== 'interrupted') {
          console.error('Falló la lectura por voz.', evento.error)
          setEstadoLector('No se pudo completar la lectura por voz.')
          setLeyendo(false)
          return
        }
        siguiente(indice + 1)
      }
      window.speechSynthesis.speak(frase)
    }
    siguiente(0)
  }, [ajustes.reducirMovimiento, compatible, detenerLectura])

  const leerPagina = () => {
    const raicesLectura = [document.querySelector('.examen') ?? document.querySelector('#contenido'), document.querySelector('.contraportada')]
      .filter((elemento): elemento is Element => elemento !== null)
    if (raicesLectura.length === 0) {
      setEstadoLector('No se encontró el contenido para leer.')
      return
    }
    const selectores = 'h1, h2, h3, p, li, blockquote, figcaption, legend, label'
    const elementos = raicesLectura.flatMap((raizLectura) =>
      Array.from(raizLectura.querySelectorAll(selectores)).filter((elemento) => {
        const caja = elemento.getBoundingClientRect()
        return (
          caja.width > 0 &&
          caja.height > 0 &&
          !elemento.closest('[data-a11y-ui], [aria-hidden="true"], [inert], .sr-only') &&
          !elemento.querySelector(selectores)
        )
      }),
    )
    leerPartes(elementos.map((elemento) => ({ elemento, texto: (elemento as HTMLElement).innerText })))
  }

  const leerSeleccion = () => {
    const seleccion = window.getSelection()?.toString().replace(/\s+/g, ' ').trim() ?? ''
    if (!seleccion) {
      setEstadoLector('Selecciona un texto de la página primero.')
      return
    }
    leerPartes([{ elemento: null, texto: seleccion }])
  }

  useEffect(() => {
    if (!ajustes.lectorVoz || !ajustes.leerAlClic || !compatible) return
    const onClick = (evento: MouseEvent) => {
      const destino = evento.target instanceof Element ? evento.target : null
      if (!destino || destino.closest('a, button, input, textarea, select, [data-a11y-ui]')) return
      const bloque = destino.closest('h1, h2, h3, p, li, blockquote, figcaption')
      if (bloque) leerPartes([{ elemento: bloque, texto: (bloque as HTMLElement).innerText }])
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [ajustes.leerAlClic, ajustes.lectorVoz, compatible, leerPartes])

  useEffect(() => {
    if (!ajustes.lectorVoz || !ajustes.leerAlEnfocar || !compatible) return
    const onFocus = (evento: FocusEvent) => {
      const elemento = evento.target instanceof HTMLElement ? evento.target : null
      if (!elemento?.matches(':focus-visible') || elemento.closest('[data-a11y-ui]')) return
      const nombre = elemento.getAttribute('aria-label') ?? elemento.innerText ?? elemento.title
      if (nombre.trim()) leerPartes([{ elemento, texto: nombre }])
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [ajustes.leerAlEnfocar, ajustes.lectorVoz, compatible, leerPartes])

  useEffect(() => {
    if (!ajustes.lectorVoz) detenerLectura()
  }, [ajustes.lectorVoz, detenerLectura])

  const opcionesLectorDeshabilitadas = !compatible || !ajustes.lectorVoz

  return (
    <>
      <svg className="accesibilidad__filtros" aria-hidden="true" focusable="false">
        {Object.entries(FILTROS_DALTONISMO).map(([nombre, valores]) => (
          <filter key={nombre} id={`savia-${nombre}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={valores} />
          </filter>
        ))}
      </svg>
      {ajustes.guiaLectura && <GuiaLectura />}
      {ajustes.mascaraLectura && <MascaraLectura />}
      <div ref={raiz} className="accesibilidad" data-a11y-ui="">
        {montado && (
          <div className={`accesibilidad__fondo ${abierto ? 'is-abierto' : ''}`} aria-hidden="true" onClick={() => setAbierto(false)} />
        )}
        {montado && (
        <aside
          id="panel-accesibilidad"
          className={`accesibilidad__panel ${abierto ? 'is-abierto' : ''}`}
          role="dialog"
          aria-modal={abierto}
          aria-labelledby="accesibilidad-titulo"
          inert={!abierto}
        >
          <header className="accesibilidad__cabecera">
            <span className="accesibilidad__sello" aria-hidden="true">
              <IconoAccesibilidad />
            </span>
            <div className="accesibilidad__encabezado">
              <p className="accesibilidad__sobrelinea">BITÁCORA PERSONAL · SAVIA</p>
              <h2 id="accesibilidad-titulo">Lectura a tu manera</h2>
            </div>
            <button
              ref={cerrar}
              type="button"
              className="accesibilidad__cerrar"
              onClick={() => {
                setAbierto(false)
                boton.current?.focus()
              }}
              aria-label="Cerrar opciones de accesibilidad"
            >
              <IconoCerrar />
            </button>
          </header>

          <div className="accesibilidad__contenido">
            <fieldset className="accesibilidad__grupo" style={{ '--i': 0 } as CSSProperties}>
              <legend>Lectura en voz alta</legend>
              <Opcion
                ajuste={ajustes.lectorVoz}
                nombre="Activar lector de voz"
                ayuda={compatible ? 'Usa la voz disponible en tu navegador.' : 'Este navegador no admite lectura por voz.'}
                deshabilitada={!compatible}
                valor={leyendo ? 'Leyendo' : ajustes.lectorVoz ? 'Activo' : 'Inactivo'}
                onChange={() => alternar('lectorVoz')}
              />
              <div className="accesibilidad__acciones-voz">
                <button type="button" disabled={!compatible} onClick={leerPagina}>
                  Leer esta página
                </button>
                <button type="button" disabled={!compatible} onClick={leerSeleccion}>
                  Leer selección
                </button>
                <button type="button" disabled={!leyendo} onClick={detenerLectura}>
                  Detener
                </button>
              </div>
              <Opcion
                ajuste={ajustes.leerAlClic}
                nombre="Leer texto al hacer clic"
                deshabilitada={opcionesLectorDeshabilitadas}
                valor={ajustes.leerAlClic ? 'Sí' : 'No'}
                onChange={() => alternar('leerAlClic')}
              />
              <Opcion
                ajuste={ajustes.leerAlEnfocar}
                nombre="Leer controles al enfocarlos"
                ayuda="Anuncia botones y enlaces al navegar con teclado."
                deshabilitada={opcionesLectorDeshabilitadas}
                valor={ajustes.leerAlEnfocar ? 'Sí' : 'No'}
                onChange={() => alternar('leerAlEnfocar')}
              />
              <p className="accesibilidad__estado-lector" aria-live="polite">
                {estadoLector}
              </p>
            </fieldset>

            <fieldset className="accesibilidad__grupo" style={{ '--i': 1 } as CSSProperties}>
              <legend>Tamaño y forma de leer</legend>
              <span className="accesibilidad__etiqueta">Tamaño del texto</span>
              <div className="accesibilidad__tamano" role="group" aria-label="Tamaño del texto">
                {([
                  ['normal', 'A', 'Normal'],
                  ['grande', 'A+', 'Grande'],
                  ['muy-grande', 'A++', 'Muy grande'],
                  ['maximo', 'A+++', 'Máximo'],
                ] as const).map(([valor, etiqueta, nombre]) => (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={ajustes.tamano === valor}
                    aria-label={nombre}
                    onClick={() => actualizar({ tamano: valor })}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>
              <Opcion
                ajuste={ajustes.fuenteDislexia}
                nombre="Tipografía para dislexia"
                ayuda="Aplica OpenDyslexic, incluida localmente."
                valor={ajustes.fuenteDislexia ? 'Activa' : 'No'}
                onChange={() => alternar('fuenteDislexia')}
              />
              <Opcion
                ajuste={ajustes.espacioTexto}
                nombre="Más espacio entre letras y líneas"
                valor={ajustes.espacioTexto ? 'Sí' : 'No'}
                onChange={() => alternar('espacioTexto')}
              />
              <Opcion
                ajuste={ajustes.renglonCorto}
                nombre="Renglones más cortos"
                ayuda="Reduce el ancho de los párrafos largos."
                valor={ajustes.renglonCorto ? 'Sí' : 'No'}
                onChange={() => alternar('renglonCorto')}
              />
              <Opcion
                ajuste={ajustes.alinearIzquierda}
                nombre="Alinear texto a la izquierda"
                valor={ajustes.alinearIzquierda ? 'Sí' : 'No'}
                onChange={() => alternar('alinearIzquierda')}
              />
            </fieldset>

            <fieldset className="accesibilidad__grupo" style={{ '--i': 2 } as CSSProperties}>
              <legend>Color y contraste</legend>
              <Opcion
                ajuste={ajustes.contraste}
                nombre="Alto contraste"
                valor={ajustes.contraste ? 'Sí' : 'No'}
                onChange={() => alternar('contraste')}
              />
              <Opcion
                ajuste={ajustes.resaltarEnlaces}
                nombre="Resaltar enlaces"
                valor={ajustes.resaltarEnlaces ? 'Sí' : 'No'}
                onChange={() => alternar('resaltarEnlaces')}
              />
              <span className="accesibilidad__etiqueta">Filtro de color · simulación visual</span>
              <div className="accesibilidad__colores" role="group" aria-label="Filtro de color">
                {MODOS_COLOR.map((modo) => (
                  <button
                    key={modo.valor}
                    type="button"
                    className={`accesibilidad__color accesibilidad__color--${modo.valor}`}
                    aria-pressed={ajustes.color === modo.valor}
                    onClick={() => actualizar({ color: modo.valor })}
                  >
                    <span className="accesibilidad__muestra" aria-hidden="true" />
                    <span>{modo.nombre}</span>
                  </button>
                ))}
              </div>
              <p className="accesibilidad__ayuda">Los filtros de color son una simulación orientativa, no una herramienta de diagnóstico.</p>
            </fieldset>

            <fieldset className="accesibilidad__grupo" style={{ '--i': 3 } as CSSProperties}>
              <legend>Enfoque y orientación</legend>
              <Opcion
                ajuste={ajustes.cursorGrande}
                nombre="Cursor grande"
                valor={ajustes.cursorGrande ? 'Sí' : 'No'}
                onChange={() => alternar('cursorGrande')}
              />
              <Opcion
                ajuste={ajustes.guiaLectura}
                nombre="Guía de lectura"
                ayuda="Una regla bajo el renglón que estás leyendo."
                valor={ajustes.guiaLectura ? 'Sí' : 'No'}
                onChange={() => alternar('guiaLectura')}
              />
              <Opcion
                ajuste={ajustes.mascaraLectura}
                nombre="Máscara de lectura"
                ayuda="Oscurece la pantalla y deja visible solo la parte que lees."
                valor={ajustes.mascaraLectura ? 'Sí' : 'No'}
                onChange={() => alternar('mascaraLectura')}
              />
              <Opcion
                ajuste={ajustes.resaltarEncabezados}
                nombre="Resaltar encabezados"
                valor={ajustes.resaltarEncabezados ? 'Sí' : 'No'}
                onChange={() => alternar('resaltarEncabezados')}
              />
              <Opcion
                ajuste={ajustes.focoVisible}
                nombre="Foco de teclado reforzado"
                valor={ajustes.focoVisible ? 'Sí' : 'No'}
                onChange={() => alternar('focoVisible')}
              />
            </fieldset>

            <fieldset className="accesibilidad__grupo" style={{ '--i': 4 } as CSSProperties}>
              <legend>Preferencias visuales</legend>
              <Opcion
                ajuste={ajustes.reducirMovimiento}
                nombre="Reducir animaciones"
                valor={ajustes.reducirMovimiento ? 'Sí' : 'No'}
                onChange={() => alternar('reducirMovimiento')}
              />
              <Opcion
                ajuste={ajustes.ocultarDecoracion}
                nombre="Reducir elementos decorativos"
                valor={ajustes.ocultarDecoracion ? 'Sí' : 'No'}
                onChange={() => alternar('ocultarDecoracion')}
              />
            </fieldset>
          </div>

          <footer className="accesibilidad__pie">
            <p>Los cambios se guardan en este dispositivo.</p>
            <button type="button" className="accesibilidad__restablecer" onClick={() => setAjustes({ ...INICIAL })}>
              Restablecer
            </button>
          </footer>
        </aside>
        )}

        <button
          ref={boton}
          type="button"
          className="accesibilidad__boton"
          aria-label="Opciones de accesibilidad"
          aria-expanded={abierto}
          aria-controls="panel-accesibilidad"
          onClick={alternarPanel}
        >
          <IconoAccesibilidad />
        </button>
      </div>
    </>
  )
}
