import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkCheckIcon,
  BookmarkIcon,
  XIcon,
} from '@animateicons/react/lucide'
import { cargarPreguntas, LETRAS, TEMAS, type Pregunta, type Prueba } from '../lib/banco'
import { BotonGuardar } from './BotonGuardar'
import { formatoReloj } from '../lib/formato'
import { useIconosAnimados } from '../lib/useIconosAnimados'

interface ExamenProps {
  prueba: Prueba
  error?: string
  onCambio: (prueba: Prueba) => void
  onEntregar: () => void
  onSalir: () => void
}

function useSegundosRestantes(limite: number) {
  const calcular = useCallback(() => Math.max(0, Math.ceil((limite - Date.now()) / 1000)), [limite])
  const [restantes, setRestantes] = useState(calcular)
  useEffect(() => {
    const id = window.setInterval(() => setRestantes(calcular()), 1000)
    return () => window.clearInterval(id)
  }, [calcular])
  return restantes
}

export function Examen({ prueba, error, onCambio, onEntregar, onSalir }: ExamenProps) {
  const restantes = useSegundosRestantes(prueba.limite)
  const animarIconos = useIconosAnimados()
  const [confirmar, setConfirmar] = useState(false)
  const [pregunta, setPregunta] = useState<Pregunta | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)
  const dialogo = useRef<HTMLDialogElement>(null)
  const enunciado = useRef<HTMLHeadingElement>(null)

  const total = prueba.items.length
  const item = prueba.items[prueba.actual]
  const elegida = prueba.respuestas[prueba.actual]
  const respondidas = prueba.respuestas.filter((r) => r !== null).length
  const marcadas = prueba.marcadas.filter(Boolean).length

  const urgencia = restantes <= 60 ? 'critico' : restantes <= 600 ? 'alerta' : ''

  useEffect(() => {
    let vigente = true
    setPregunta(null)
    setErrorCarga(false)
    void cargarPreguntas()
      .then((preguntas) => {
        if (!vigente) return
        const encontrada = preguntas.find((p) => p.id === item.id)
        if (encontrada) setPregunta(encontrada)
        else {
          console.error(`No se encontró la pregunta ${item.id} en el banco cargado.`)
          setErrorCarga(true)
        }
      })
      .catch((error: unknown) => {
        console.error('No se pudo cargar el banco de preguntas.', error)
        if (vigente) setErrorCarga(true)
      })
    return () => {
      vigente = false
    }
  }, [item.id])

  useEffect(() => {
    if (restantes === 0) onEntregar()
  }, [restantes, onEntregar])

  // al cambiar de pregunta, el foco va al enunciado para lectores de pantalla y teclado
  useEffect(() => {
    enunciado.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [prueba.actual])

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (confirmar && !d.open) d.showModal()
    if (!confirmar && d.open) d.close()
  }, [confirmar])

  const ir = useCallback((i: number) => onCambio({ ...prueba, actual: Math.max(0, Math.min(total - 1, i)) }), [prueba, total, onCambio])

  const elegir = useCallback(
    (opcion: number, alternar = false) => {
      const respuestas = [...prueba.respuestas]
      respuestas[prueba.actual] = alternar && respuestas[prueba.actual] === opcion ? null : opcion
      onCambio({ ...prueba, respuestas })
    },
    [prueba, onCambio],
  )

  const marcar = () => {
    const nuevas = [...prueba.marcadas]
    nuevas[prueba.actual] = !nuevas[prueba.actual]
    onCambio({ ...prueba, marcadas: nuevas })
  }

  useEffect(() => {
    const onTecla = (e: KeyboardEvent) => {
      if (confirmar || e.ctrlKey || e.metaKey || e.altKey) return
      const enOpcion = (e.target as HTMLElement | null)?.matches?.('input[type="radio"]')
      const tecla = e.key.toUpperCase()
      const porLetra = LETRAS.indexOf(tecla)
      const porNumero = ['1', '2', '3', '4'].indexOf(e.key)
      const posicion = porLetra >= 0 ? porLetra : porNumero
      if (posicion >= 0) {
        e.preventDefault()
        elegir(item.orden[posicion])
      } else if (!enOpcion && e.key === 'ArrowRight') ir(prueba.actual + 1)
      else if (!enOpcion && e.key === 'ArrowLeft') ir(prueba.actual - 1)
    }
    window.addEventListener('keydown', onTecla)
    return () => window.removeEventListener('keydown', onTecla)
  }, [confirmar, elegir, ir, item, prueba.actual])

  if (errorCarga) {
    return (
      <main className="contenedor pagina" role="alert">
        <h1 className="pagina__titulo">No se pudo cargar la pregunta</h1>
        <p className="pagina__texto">Revisa tu conexión y recarga la página para continuar con la prueba.</p>
        <button type="button" className="boton" onClick={() => window.location.reload()}>
          Recargar página
        </button>
      </main>
    )
  }

  if (!pregunta) {
    return (
      <main className="contenedor pagina" aria-live="polite">
        <p className="pagina__texto">Cargando pregunta…</p>
      </main>
    )
  }

  return (
    <div className="examen">
      {error && (
        <p className="error-carga examen__error" role="alert">
          {error}
        </p>
      )}
      <header className="examen-barra">
        <div className="examen-barra__fila">
          <button type="button" className="examen-barra__salir" onClick={onSalir}>
            <ArrowLeftIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
            <span>Salir</span>
          </button>
          <div className="examen-barra__centro">
            <span className="examen-barra__modo">{prueba.nombre.replace(/^Práctica · /, '')}</span>
            <span className="examen-barra__progreso">
              <strong>{respondidas}</strong> de {total} respondidas
            </span>
          </div>
          <div
            className={`examen-barra__reloj ${urgencia ? `examen-barra__reloj--${urgencia}` : ''}`}
            role="timer"
            aria-live="off"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2.5M9.5 2h5" />
            </svg>
            <span className="sr-only">Tiempo restante: </span>
            {formatoReloj(restantes)}
          </div>
        </div>
        <div className="examen-barra__avance" aria-hidden="true">
          <span style={{ transform: `scaleX(${respondidas / total})` }} />
        </div>
      </header>

      <div className="examen__cuerpo">
        <main className="hoja">
          <div className="hoja__meta">
            <span className="hoja__numero">Pregunta {prueba.actual + 1}</span>
            <span className="hoja__tema">
              {pregunta.t} · {TEMAS[pregunta.t]}
            </span>
            <BotonGuardar id={pregunta.id} />
          </div>
          <h1 className="hoja__enunciado" ref={enunciado} tabIndex={-1}>
            {pregunta.p}
          </h1>

          <fieldset className="opciones">
            <legend className="sr-only">Opciones de la pregunta {prueba.actual + 1}</legend>
            {item.orden.map((original, posicion) => {
              const activa = elegida === original
              return (
                <label key={original} className={`opcion ${activa ? 'is-marcada' : ''}`}>
                  <input
                    type="radio"
                    name={`p-${item.id}`}
                    className="sr-only"
                    checked={activa}
                    onChange={() => elegir(original)}
                    onClick={() => activa && elegir(original, true)}
                  />
                  <span className="opcion__burbuja" aria-hidden="true">
                    <span className="opcion__letra">{LETRAS[posicion]}</span>
                    <XIcon className="opcion__x" size={18} isAnimated={animarIconos} aria-hidden="true" />
                  </span>
                  <span className="opcion__texto">{pregunta.o[original]}</span>
                </label>
              )
            })}
          </fieldset>

          <div className="hoja__acciones">
            <button type="button" className="boton" onClick={() => ir(prueba.actual - 1)} disabled={prueba.actual === 0}>
              <ArrowLeftIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
              Anterior
            </button>
            <button
              type="button"
              className={`boton boton--marca ${prueba.marcadas[prueba.actual] ? 'is-activa' : ''}`}
              aria-pressed={prueba.marcadas[prueba.actual]}
              aria-label={prueba.marcadas[prueba.actual] ? 'Quitar marca de revisión' : 'Marcar pregunta para revisar luego'}
              onClick={marcar}
            >
              {prueba.marcadas[prueba.actual] ? (
                <BookmarkCheckIcon className="boton--marca__icono" size={16} isAnimated={animarIconos} aria-hidden="true" />
              ) : (
                <BookmarkIcon className="boton--marca__icono" size={16} isAnimated={animarIconos} aria-hidden="true" />
              )}
              <span>{prueba.marcadas[prueba.actual] ? 'Marcada para revisar' : 'Marcar para revisar'}</span>
            </button>
            {prueba.actual < total - 1 ? (
              <button type="button" className="boton boton--tinta" onClick={() => ir(prueba.actual + 1)}>
                Siguiente
                <ArrowRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="boton boton--tinta" onClick={() => setConfirmar(true)}>
                Entregar
              </button>
            )}
          </div>
          <p className="atajos">
            <span className="atajos__titulo">Teclas rápidas</span>
            <span className="atajos__grupo">
              <kbd>A–D</kbd> o <kbd>1–4</kbd>
              <span>responder</span>
            </span>
            <span className="atajos__grupo">
              <kbd>←</kbd> <kbd>→</kbd>
              <span>cambiar pregunta</span>
            </span>
          </p>
        </main>

        <aside className="tarjeta" aria-label="Hoja de respuestas">
          <h2 className="tarjeta__titulo">Hoja de respuestas</h2>
          <ol className="tarjeta__grilla">
            {prueba.items.map((it, i) => {
              const r = prueba.respuestas[i]
              const estado = [
                r !== null ? 'is-respondida' : '',
                prueba.marcadas[i] ? 'is-marcada' : '',
                i === prueba.actual ? 'is-actual' : '',
              ].join(' ')
              const letra = r !== null ? LETRAS[it.orden.indexOf(r)] : ''
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    className={`celda ${estado}`}
                    onClick={() => ir(i)}
                    aria-current={i === prueba.actual ? 'step' : undefined}
                    aria-label={`Pregunta ${i + 1}${r !== null ? `, respondida ${letra}` : ', sin responder'}${prueba.marcadas[i] ? ', marcada para revisar' : ''}`}
                  >
                    <span className="celda__n">{i + 1}</span>
                    <span className="celda__r">{letra}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <ul className="tarjeta__leyenda">
            <li>
              <span className="punto punto--respondida" /> Respondida
            </li>
            <li>
              <span className="punto punto--marcada" /> Marcada para revisar ({marcadas})
            </li>
          </ul>
          <button type="button" className="boton boton--tinta boton--ancho" onClick={() => setConfirmar(true)}>
            Entregar prueba
          </button>
        </aside>
      </div>

      <dialog ref={dialogo} className="dialogo" onClose={() => setConfirmar(false)} aria-labelledby="dialogo-titulo">
        <h2 id="dialogo-titulo">¿Entregar la prueba?</h2>
        <p>
          Respondiste <strong>{respondidas}</strong> de <strong>{total}</strong> preguntas.
          {total - respondidas > 0 && (
            <>
              {' '}
              Las <strong>{total - respondidas}</strong> sin responder cuentan como incorrectas.
            </>
          )}
          {marcadas > 0 && (
            <>
              {' '}
              Tienes <strong>{marcadas}</strong> marcadas para revisar.
            </>
          )}
        </p>
        <div className="dialogo__acciones">
          <button type="button" className="boton" onClick={() => setConfirmar(false)}>
            Seguir respondiendo
          </button>
          <button type="button" className="boton boton--tinta" onClick={onEntregar}>
            Entregar
          </button>
        </div>
      </dialog>
    </div>
  )
}
