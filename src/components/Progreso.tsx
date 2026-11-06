import { ArrowRightIcon, RepeatIcon, StarIcon, TrendingUpIcon } from '@animateicons/react/lucide'
import resumenTemas from 'virtual:resumen-temas'
import { estadoRepaso, idsGuardadas, pendientesDeRepaso, progresoPorTema, useAprendizaje } from '../lib/aprendizaje'
import { NOTA_MINIMA, TEMAS, type TemaCodigo } from '../lib/banco'
import { useIconosAnimados } from '../lib/useIconosAnimados'
import { Cinta } from './Cinta'

interface ProgresoProps {
  onRepasar: (ids: number[]) => void
  onGuardadas: (ids: number[]) => void
  onPracticarTema: (tema: TemaCodigo) => void
}

const fechaCorta = (ms: number) => new Date(ms).toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })

// Tablero personal: repaso del día, preguntas guardadas, recomendación y avance por tema.
export function Progreso({ onRepasar, onGuardadas, onPracticarTema }: ProgresoProps) {
  useAprendizaje()
  const animarIconos = useIconosAnimados()
  const temas = progresoPorTema()
  const repaso = estadoRepaso()
  const pendientes = pendientesDeRepaso()
  const guardadas = idsGuardadas()
  const conDatos = temas.filter((t) => t.dominio !== null)

  // Recomendación: el tema con menor dominio (con al menos 3 respuestas); si aún no hay
  // suficientes datos, el tema que menos ha practicado.
  const evaluables = conDatos.filter((t) => t.vistas >= 3).sort((a, b) => (a.dominio ?? 0) - (b.dominio ?? 0))
  const sugerido = evaluables[0] ?? [...temas].sort((a, b) => a.distintas - b.distintas)[0]

  return (
    <section className="progreso" aria-labelledby="progreso-titulo">
      <div className="progreso__cabecera">
        <Cinta className="seccion__kicker">Tu cuaderno</Cinta>
        <h2 id="progreso-titulo" className="practica__subtitulo">
          Repaso y avance
        </h2>
      </div>

      <div className="progreso__accesos">
        <article className={`acceso ${repaso.pendientes ? 'is-pendiente' : ''}`}>
          <span className="acceso__icono" aria-hidden="true">
            <RepeatIcon size={22} isAnimated={animarIconos} aria-hidden="true" />
          </span>
          <h3 className="acceso__titulo">Repaso del día</h3>
          {repaso.pendientes ? (
            <>
              <p className="acceso__texto">
                Tienes <strong>{repaso.pendientes}</strong> {repaso.pendientes === 1 ? 'pregunta' : 'preguntas'} que fallaste antes y ya toca
                repasar.
              </p>
              <button type="button" className="boton boton--tinta" onClick={() => onRepasar(pendientes.slice(0, 30))}>
                Repasar ahora <ArrowRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
              </button>
            </>
          ) : (
            <p className="acceso__texto">
              {repaso.enCurso
                ? `Todo al día. Tu próximo repaso es el ${fechaCorta(repaso.siguiente ?? Date.now())}.`
                : 'Las preguntas que falles volverán aquí unos días después, hasta que las aciertes varias veces seguidas.'}
            </p>
          )}
          {repaso.dominadas > 0 && (
            <p className="acceso__dato">
              {repaso.dominadas} {repaso.dominadas === 1 ? 'pregunta dominada' : 'preguntas dominadas'} después de fallarlas
            </p>
          )}
        </article>

        <article className="acceso">
          <span className="acceso__icono" aria-hidden="true">
            <StarIcon size={22} isAnimated={animarIconos} aria-hidden="true" />
          </span>
          <h3 className="acceso__titulo">Mis guardadas</h3>
          {guardadas.length ? (
            <>
              <p className="acceso__texto">
                Guardaste <strong>{guardadas.length}</strong> {guardadas.length === 1 ? 'pregunta' : 'preguntas'} para practicar aparte.
              </p>
              <button type="button" className="boton" onClick={() => onGuardadas(guardadas)}>
                Practicar guardadas <ArrowRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
              </button>
            </>
          ) : (
            <p className="acceso__texto">Durante una prueba o al revisarla, toca la estrella para guardar las preguntas que quieras repasar.</p>
          )}
        </article>
      </div>

      {conDatos.length > 0 && sugerido && (
        <div className="sugerencia">
          <TrendingUpIcon className="sugerencia__icono" size={22} isAnimated={animarIconos} aria-hidden="true" />
          <p>
            Te conviene practicar <strong>{TEMAS[sugerido.tema]}</strong>
            {sugerido.dominio !== null && evaluables.length > 0 && <> (vas {sugerido.dominio} %)</>}.
            {sugerido.subtemaDebil && <> Lo que más te cuesta: {sugerido.subtemaDebil}.</>}
          </p>
          <button type="button" className="enlace" onClick={() => onPracticarTema(sugerido.tema)}>
            Practicar ese tema
          </button>
        </div>
      )}

      <ul className="avance" aria-label="Avance por tema">
        {temas.map((t) => {
          const total = resumenTemas[t.tema].preguntas
          const estado = t.dominio === null ? 'is-vacio' : t.dominio >= NOTA_MINIMA ? 'is-bien' : 'is-mal'
          return (
            <li key={t.tema} className={`avance__tema ${estado}`}>
              <div className="avance__fila">
                <span className="avance__nombre">
                  <span className="temas__codigo">{t.tema}</span> {TEMAS[t.tema]}
                </span>
                <span className="avance__dato">{t.dominio === null ? 'Sin practicar' : `${t.dominio} %`}</span>
              </div>
              <div
                className="avance__barra"
                role="progressbar"
                aria-label={`Aciertos en ${TEMAS[t.tema]}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={t.dominio ?? 0}
              >
                <span style={{ width: `${t.dominio ?? 0}%` }} />
              </div>
              <p className="avance__cobertura">
                Has visto {t.distintas} de {total} preguntas del tema
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
