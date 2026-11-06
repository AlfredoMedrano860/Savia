// Revisión automática del banco de preguntas (src/data/preguntas.json).
// Uso: node scripts/revisar-banco.mjs
// Reporta problemas de forma (no corrige nada): opciones repetidas, respuestas fuera de
// rango, explicaciones vacías o muy cortas, espacios sobrantes, preguntas casi iguales y
// opciones que dependen del orden ("todas las anteriores", "A y B"), que se rompen al
// mezclar las opciones, y enunciados repetidos que tienen respuestas distintas.
import { readFileSync } from 'node:fs'

const banco = JSON.parse(readFileSync(new URL('../src/data/preguntas.json', import.meta.url), 'utf8'))

const norma = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim()
// Palabras del enunciado respetando mayúsculas y números (en genética, Aa y aa no son lo mismo).
const palabras = (t) => new Set(t.normalize('NFC').replace(/[¿?¡!.,:;()«»"]/g, ' ').split(/s+/).filter(Boolean))
const jaccard = (a, b) => {
  let comun = 0
  for (const w of a) if (b.has(w)) comun++
  return comun / (a.size + b.size - comun || 1)
}

const DEPENDE_DEL_ORDEN = /\b(todas las anteriores|ninguna de las anteriores|ambas|las dos anteriores|a y b|b y c|a y c|anteriores)\b/i

const hallazgos = {
  'Opciones repetidas': [],
  'Respuesta fuera de rango': [],
  'Explicación vacía o muy corta (< 40 caracteres)': [],
  'Espacios sobrantes': [],
  'Opción que depende del orden': [],
  'Enunciado idéntico con otra respuesta correcta': [],
  'Preguntas casi iguales (≥ 90 % de palabras en común)': [],
}

for (const p of banco) {
  const opciones = p.o.map((o) => o.trim())
  if (new Set(opciones).size !== opciones.length) hallazgos['Opciones repetidas'].push(`#${p.id}: ${p.o.join(' | ')}`)
  if (!(p.r >= 0 && p.r < p.o.length)) hallazgos['Respuesta fuera de rango'].push(`#${p.id}: r=${p.r}`)
  if (!p.e || p.e.trim().length < 40) hallazgos['Explicación vacía o muy corta (< 40 caracteres)'].push(`#${p.id}: "${p.e}"`)
  for (const texto of [p.p, p.e, ...p.o]) {
    if (texto !== texto.trim() || /\s{2,}/.test(texto)) {
      hallazgos['Espacios sobrantes'].push(`#${p.id}`)
      break
    }
  }
  const dependiente = p.o.find((o) => DEPENDE_DEL_ORDEN.test(o))
  if (dependiente) hallazgos['Opción que depende del orden'].push(`#${p.id}: "${dependiente}"`)
}

const conjuntos = banco.map((p) => ({ id: p.id, t: p.t, w: palabras(p.p) }))
for (let i = 0; i < conjuntos.length; i++) {
  for (let j = i + 1; j < conjuntos.length; j++) {
    const a = conjuntos[i]
    const b = conjuntos[j]
    if (a.t !== b.t || a.w.size < 4) continue
    const s = jaccard(a.w, b.w)
    if (s >= 0.9) hallazgos['Preguntas casi iguales (≥ 90 % de palabras en común)'].push(`#${a.id} y #${b.id} (${Math.round(s * 100)} %)`)
  }
}

const porEnunciado = new Map()
for (const p of banco) {
  const clave = p.p.trim()
  const previa = porEnunciado.get(clave)
  if (previa && previa.o[previa.r].trim() !== p.o[p.r].trim()) {
    hallazgos['Enunciado idéntico con otra respuesta correcta'].push(`#${previa.id} y #${p.id}: "${previa.o[previa.r]}" vs "${p.o[p.r]}"`)
  }
  porEnunciado.set(clave, p)
}

const respuestas = [0, 0, 0, 0]
for (const p of banco) respuestas[p.r]++

console.log(`Banco: ${banco.length} preguntas`)
console.log(`Posición de la respuesta correcta (A/B/C/D en el banco original): ${respuestas.join(' / ')}\n`)
for (const [titulo, lista] of Object.entries(hallazgos)) {
  console.log(`${titulo}: ${lista.length}`)
  for (const linea of lista.slice(0, 40)) console.log(`  - ${linea}`)
  if (lista.length > 40) console.log(`  … y ${lista.length - 40} más`)
}
