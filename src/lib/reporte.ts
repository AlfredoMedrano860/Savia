import { TEMAS, type Pregunta } from './banco'
import { SOPORTE } from './proyecto'

/**
 * Enlace "Reportar un error" de una pregunta: abre el correo de la persona dirigido a
 * soporte, con el número de la pregunta, su tema, el enunciado y la respuesta que Savia da
 * como correcta ya escritos, para que solo tenga que contar qué está mal. La respuesta va
 * con su texto y no con su letra, porque el orden de las opciones cambia en cada prueba.
 */
export function enlaceReporte(pregunta: Pregunta) {
  const asunto = `Error en la pregunta #${pregunta.id}`
  const cuerpo = [
    `Pregunta #${pregunta.id} · ${pregunta.t} ${TEMAS[pregunta.t]} · ${pregunta.s}`,
    '',
    pregunta.p,
    '',
    `Respuesta que Savia da como correcta: ${pregunta.o[pregunta.r]}`,
    '',
    '¿Qué está mal?',
    '',
  ].join('\n')
  return `mailto:${SOPORTE.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}
