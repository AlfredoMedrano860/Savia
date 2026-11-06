import { PreguntaDelDia } from '../components/PreguntaDelDia'
import { Progreso } from '../components/Progreso'
import type { TemaCodigo } from '../lib/banco'

interface MiProgresoProps {
  onRepasar: (ids: number[]) => void
  onGuardadas: (ids: number[]) => void
  onPracticarTema: (tema: TemaCodigo) => void
}

// Sección personal: la pregunta del día y el tablero de progreso (repaso del día, preguntas
// guardadas, recomendación y avance por tema). Todo se guarda solo en este navegador.
export function MiProgreso({ onRepasar, onGuardadas, onPracticarTema }: MiProgresoProps) {
  return (
    <main className="contenedor pagina mi-progreso">
      <header className="pagina__cabecera">
        <h1 className="pagina__titulo">Mi progreso</h1>
        <p className="pagina__texto">
          Responde la pregunta del día, repasa lo que fallaste y mira cómo vas en cada tema. Tu avance se guarda solo en este
          dispositivo.
        </p>
      </header>

      <PreguntaDelDia />

      <Progreso onRepasar={onRepasar} onGuardadas={onGuardadas} onPracticarTema={onPracticarTema} />
    </main>
  )
}
