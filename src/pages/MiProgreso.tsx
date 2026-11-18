import { PreguntaDelDia } from '../components/PreguntaDelDia'
import { Progreso } from '../components/Progreso'
import type { TemaCodigo } from '../lib/banco'

interface MiProgresoProps {
  onRepasar: (ids: number[]) => void
  onGuardadas: (ids: number[]) => void
  onPuntosDebiles: () => void
  onPracticarTema: (tema: TemaCodigo) => void
}

// Sección personal: la pregunta del día, el tablero de progreso (repaso del día, preguntas
// guardadas, puntos débiles, recomendación y avance por tema).
export function MiProgreso({ onRepasar, onGuardadas, onPuntosDebiles, onPracticarTema }: MiProgresoProps) {
  return (
    <main className="contenedor pagina mi-progreso">
      <header className="pagina__cabecera">
        <h1 className="pagina__titulo">Mi progreso</h1>
        <p className="pagina__texto">
          Responde la pregunta del día, repasa lo que fallaste y mira cómo vas en cada tema. Si inicias sesión, tu avance
          se guarda en tu cuenta.
        </p>
      </header>

      <PreguntaDelDia />

      <Progreso onRepasar={onRepasar} onGuardadas={onGuardadas} onPuntosDebiles={onPuntosDebiles} onPracticarTema={onPracticarTema} />
    </main>
  )
}
