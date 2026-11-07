import { useState, type FormEvent } from 'react'
import { ArrowRightIcon, PrinterIcon } from '@animateicons/react/lucide'
import { MODOS, NOTA_MINIMA, normalizarCodigo, porcentaje, type Modo, type Prueba, type Resultado } from '../lib/banco'
import { formatoDuracion, formatoFecha } from '../lib/formato'
import { useIconosAnimados } from '../lib/useIconosAnimados'
import { HojaCuaderno } from '../components/HojaCuaderno'
import { MarcoDoble } from '../components/MarcoDoble'
import { Cinta } from '../components/Cinta'

const DESCRIPCIONES: Record<Modo['id'], string> = {
  completa: 'Un recorrido amplio por los seis temas, con el tiempo de la prueba real.',
  corta: 'Una sesión más breve para medir tu avance.',
  quiz: 'Repasa conceptos en pocos minutos.',
  repaso: 'Vuelve a las preguntas que quieres reforzar.',
  tema: 'Practica un tema específico.',
}

// La prueba más larga llena el reloj; las demás muestran su parte.
const MINUTOS_MAX = Math.max(...MODOS.map((m) => m.minutos))

interface PracticarProps {
  enCurso: Prueba | null
  historial: Resultado[]
  onEmpezar: (modo: Modo) => void
  onContinuar: () => void
  onVerIntento: (resultado: Resultado) => void
  onBorrarHistorial: () => void
  onImprimir: (modo: Modo) => void
  onAbrirCodigo: (codigo: string) => void
}

export function Practicar({
  enCurso,
  historial,
  onEmpezar,
  onContinuar,
  onVerIntento,
  onBorrarHistorial,
  onImprimir,
  onAbrirCodigo,
}: PracticarProps) {
  const respondidas = enCurso ? enCurso.respuestas.filter((r) => r !== null).length : 0
  const animarIconos = useIconosAnimados()
  const [codigo, setCodigo] = useState('')
  const [errorCodigo, setErrorCodigo] = useState('')

  const verRespuestas = (e: FormEvent) => {
    e.preventDefault()
    const valido = normalizarCodigo(codigo)
    if (!valido) {
      setErrorCodigo('Revisa el código: son 6 caracteres, como Q7K M2X.')
      return
    }
    setErrorCodigo('')
    onAbrirCodigo(valido)
  }

  return (
    <main className="contenedor pagina practica">
      <header className="practica__cabecera">
        <h1 className="practica__titulo">Practicar</h1>
        <p className="practica__texto">
          Las preguntas salen al azar y repartidas entre los seis temas. Si se acaba el tiempo, la prueba se entrega sola.
        </p>
      </header>

      {enCurso && (
        <section className="retomar" aria-labelledby="retomar-titulo">
          <div className="retomar__info">
            <p className="retomar__rotulo">Te quedaste aquí</p>
            <h2 id="retomar-titulo" className="retomar__titulo">
              {enCurso.nombre}
            </h2>
            <div
              className="retomar__barra"
              role="progressbar"
              aria-label="Preguntas respondidas"
              aria-valuemin={0}
              aria-valuemax={enCurso.items.length}
              aria-valuenow={respondidas}
            >
              <span style={{ width: `${(respondidas / enCurso.items.length) * 100}%` }} />
            </div>
            <p className="retomar__dato">
              {respondidas} de {enCurso.items.length} respondidas
            </p>
          </div>
          <button type="button" className="boton boton--tinta" onClick={onContinuar}>
            Continuar <ArrowRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
          </button>
        </section>
      )}

      <section className="practica__bloque" aria-labelledby="modos-titulo">
        <h2 id="modos-titulo" className="practica__subtitulo">
          ¿Cuánto tiempo tienes?
        </h2>
        <ul className="rejilla-3 fichas">
          {MODOS.map((modo, i) => (
            <li key={modo.id}>
              <MarcoDoble as="button" interactivo type="button" className={`ficha ficha--${modo.id}`} onClick={() => onEmpezar(modo)}>
                {modo.id === 'completa' && <Cinta as="span" className="ficha__cinta">como la prueba real</Cinta>}
                <span className="ficha__cabecera">
                  <span className="ficha__numero">Ficha {String(i + 1).padStart(2, '0')}</span>
                  <Reloj fraccion={modo.minutos / MINUTOS_MAX} texto={formatoDuracion(modo.minutos * 60, true)} />
                </span>
                <span className="ficha__nombre">{modo.nombre}</span>
                <span className="ficha__descripcion">{DESCRIPCIONES[modo.id]}</span>
                <span className="ficha__pie">
                  <span className="ficha__preguntas">
                    <strong>{modo.preguntas}</strong> preguntas
                  </span>
                  <span className="ficha__flecha" aria-hidden="true">
                    <ArrowRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
                  </span>
                </span>
              </MarcoDoble>
            </li>
          ))}
        </ul>
        <p className="practica__nota">
          Para aprobar necesitas <strong>{NOTA_MINIMA}</strong> o más. ¿Quieres reforzar un tema en particular? Entra al{' '}
          <a href="#/temario">temario</a>.
        </p>
      </section>

      <section className="en-papel" aria-labelledby="imprimir-titulo">
        <HojaCuaderno variante="solo-papel" className="en-papel__hoja">
          <Cinta className="seccion__kicker">En papel</Cinta>
          <h2 id="imprimir-titulo" className="en-papel__titulo">
            Imprime una prueba
          </h2>
          <p className="en-papel__texto">
            Para estudiar sin pantalla o guardarla en PDF. Elige el tamaño; las respuestas no se imprimen.
          </p>
          <ul className="en-papel__opciones" aria-label="Tamaño de la prueba para imprimir">
            {[...MODOS].reverse().map((modo) => (
              <li key={modo.id}>
                <button type="button" className={`mini-hoja mini-hoja--${modo.id}`} onClick={() => onImprimir(modo)}>
                  <span className="mini-hoja__nombre">{modo.nombre}</span>
                  <span className="mini-hoja__numero">{modo.preguntas}</span>
                  <span className="mini-hoja__dato">preguntas · {formatoDuracion(modo.minutos * 60, true).replace(/ h$/, ' hrs')}</span>
                  <span className="mini-hoja__accion">
                    <PrinterIcon size={16} isAnimated={animarIconos} aria-hidden="true" />
                    Generar
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </HojaCuaderno>

        <form className="en-papel__talon" onSubmit={verRespuestas} aria-labelledby="talon-titulo">
          <p className="en-papel__talon-rotulo">Talón de respuestas</p>
          <h3 id="talon-titulo" className="en-papel__talon-titulo">
            ¿Ya la resolviste?
          </h3>
          <label className="en-papel__talon-texto" htmlFor="codigo-prueba">
            Escribe el código que viene impreso en tu prueba para ver las respuestas y tu nota.
          </label>
          <input
            id="codigo-prueba"
            className="en-papel__codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Q7K M2X"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={9}
            aria-invalid={errorCodigo ? true : undefined}
            aria-describedby={errorCodigo ? 'codigo-error' : undefined}
          />
          {errorCodigo && (
            <p id="codigo-error" className="en-papel__error" role="alert">
              {errorCodigo}
            </p>
          )}
          <button type="submit" className="boton boton--tinta en-papel__ver">
            Ver respuestas <ArrowRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
          </button>
        </form>
      </section>

      {historial.length > 0 && (
        <section className="panel practicar__historial" aria-labelledby="historial-titulo">
          <div className="titulo-fila">
            <div>
              <Cinta className="seccion__kicker">Registro personal</Cinta>
              <h2 id="historial-titulo" className="titulo-seccion">
                Tus intentos
              </h2>
            </div>
            <button type="button" className="enlace" onClick={onBorrarHistorial}>
              Borrar historial
            </button>
          </div>
          <div className="tabla-scroll">
            <table className="historial">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Prueba</th>
                  <th scope="col">Nota</th>
                  <th scope="col">Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {historial.slice(0, 10).map((r) => {
                  const nota = porcentaje(r)
                  return (
                    <tr key={r.fecha}>
                      <td>{formatoFecha(r.fecha)}</td>
                      <td>
                        {r.nombre}
                        {r.detalle.length > 0 && (
                          <>
                            {' · '}
                            <button type="button" className="enlace" onClick={() => onVerIntento(r)} aria-label={`Revisar ${r.nombre} del ${formatoFecha(r.fecha)}`}>
                              revisar
                            </button>
                          </>
                        )}
                      </td>
                      <td className={nota >= NOTA_MINIMA ? 'nota-aprobada' : 'nota-reprobada'}>
                        {nota} <span className="sr-only">{nota >= NOTA_MINIMA ? 'aprobada' : 'no aprobada'}</span>
                      </td>
                      <td>{formatoDuracion(r.segundos)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="practica__privacidad">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Tus intentos se guardan solo en este navegador; no se suben ni se sincronizan con otros equipos.
      </p>
    </main>
  )
}

// Reloj de anillo: la parte llena es el tiempo de la prueba frente a la más larga.
function Reloj({ fraccion, texto }: { fraccion: number; texto: string }) {
  const radio = 22
  const largo = 2 * Math.PI * radio
  const [cantidad, unidad] = texto.split(' ')
  return (
    <span className="anillo">
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle className="anillo__fondo" cx="28" cy="28" r={radio} />
        <circle
          className="anillo__arco"
          cx="28"
          cy="28"
          r={radio}
          strokeDasharray={`${largo * fraccion} ${largo}`}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <span className="anillo__texto">
        <span className="sr-only">Tiempo: </span>
        {cantidad}
        <small>{unidad === 'h' ? 'hrs' : unidad}</small>
      </span>
    </span>
  )
}
