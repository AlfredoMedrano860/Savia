/*
 * Aviso de "el progreso cambió". Lo llaman los módulos que guardan datos de la persona
 * (historial, aprendizaje, guardadas, pregunta del día, accesibilidad) y lo escucha la cuenta
 * para subir el progreso a la nube. Vive aparte para que esos módulos no dependan de Firebase.
 */
const oyentes = new Set<() => void>()

export function avisarCambioDeProgreso() {
  oyentes.forEach((oyente) => oyente())
}

export function alCambiarProgreso(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
