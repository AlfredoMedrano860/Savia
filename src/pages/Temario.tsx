import { useEffect, useState } from 'react'
import { cargarPreguntas, CODIGOS, MINUTOS_POR_PREGUNTA, PREGUNTAS_POR_TEMA, TEMAS, subtemas, type Pregunta, type TemaCodigo } from '../lib/banco'
import { destinoTemario } from '../lib/ruta'
import { BancoTema } from '../components/BancoTema'
import { Modal } from '../components/Modal'

// Tema y subtema que pide la dirección (#/temario/T22/Genética); se actualiza al cambiarla.
function useDestino() {
  const [destino, setDestino] = useState(destinoTemario)
  useEffect(() => {
    const alCambiar = () => setDestino(destinoTemario())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])
  return destino
}

export function Temario({ onPracticarTema }: { onPracticarTema: (tema: TemaCodigo) => void }) {
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)
  const destino = useDestino()
  // Banco abierto en el modal: el tema y el subtema elegido (null = todos); null = cerrado.
  const [banco, setBanco] = useState<{ tema: TemaCodigo; subtema: string | null } | null>(null)
  const abrirBanco = (tema: TemaCodigo, subtema: string | null) => setBanco({ tema, subtema })

  useEffect(() => {
    let vigente = true
    void cargarPreguntas()
      .then((banco) => {
        if (vigente) setPreguntas(banco)
      })
      .catch((error: unknown) => {
        console.error('No se pudo cargar el banco de preguntas para el temario.', error)
        if (vigente) setErrorCarga(true)
      })
    return () => {
      vigente = false
    }
  }, [])

  // Con un destino en la dirección, baja hasta ese tema una vez cargado el temario.
  useEffect(() => {
    if (!preguntas || !destino) return
    const id = window.setTimeout(() => {
      document.getElementById(`tema-${destino.tema}`)?.scrollIntoView({ block: 'start' })
    }, 60)
    return () => window.clearTimeout(id)
  }, [preguntas, destino])

  return (
    <main className="contenedor pagina">
      <header className="pagina__cabecera">
        <h1 className="pagina__titulo">Temario</h1>
        <p className="pagina__texto">
          Estos son los seis temas que evalúa la prueba de Biología y los contenidos de cada uno. Puedes practicar un tema por aparte
          con {PREGUNTAS_POR_TEMA} preguntas y {PREGUNTAS_POR_TEMA * MINUTOS_POR_PREGUNTA} minutos.
        </p>
      </header>

      {errorCarga ? (
        <p className="error-carga" role="alert">
          No se pudo cargar el banco para mostrar el temario. Recarga la página para intentarlo de nuevo.
        </p>
      ) : !preguntas ? (
        <p className="pagina__texto" aria-live="polite">
          Cargando temario…
        </p>
      ) : (
        <ol className="temario">
          {CODIGOS.map((t) => {
            const lista = subtemas(t, preguntas)
            const delTema = preguntas.filter((p) => p.t === t)
            const total = delTema.length
            return (
              <li key={t} id={`tema-${t}`} className={`panel temario__tema ${destino?.tema === t ? 'is-destino' : ''}`}>
                <div className="temario__cabecera">
                  <div>
                    <p className="temario__codigo">{t}</p>
                    <h2 className="temario__nombre">{TEMAS[t]}</h2>
                    <p className="temario__total">{total} preguntas en el banco</p>
                  </div>
                  <div className="temario__acciones">
                    <button type="button" className="boton boton--tinta" onClick={() => onPracticarTema(t)}>
                      Practicar este tema
                    </button>
                    <button type="button" className="boton-discreto" aria-haspopup="dialog" onClick={() => abrirBanco(t, null)}>
                      Ver las {total} preguntas
                    </button>
                  </div>
                </div>
                <ul className="temario__subtemas">
                  {lista.map((s) => (
                    <li key={s.nombre} className={destino?.tema === t && destino.subtema === s.nombre ? 'is-destacado' : undefined}>
                      <button
                        type="button"
                        className="temario__subtema"
                        aria-haspopup="dialog"
                        onClick={() => abrirBanco(t, s.nombre)}
                        aria-label={`Ver las ${s.total} preguntas de ${s.nombre}`}
                      >
                        <span>{s.nombre}</span>
                        <span className="temario__conteo">{s.total}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>
      )}

      {banco && preguntas && (
        <Modal etiqueta={`${banco.tema} · Banco de preguntas`} titulo={TEMAS[banco.tema]} onCerrar={() => setBanco(null)}>
          <BancoTema
            preguntas={preguntas.filter((p) => p.t === banco.tema)}
            subtemas={subtemas(banco.tema, preguntas)}
            subtema={banco.subtema}
            onSubtema={(sub) => abrirBanco(banco.tema, sub)}
          />
        </Modal>
      )}
    </main>
  )
}
