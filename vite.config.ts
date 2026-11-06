import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const BANCO = fileURLToPath(new URL('./src/data/preguntas.json', import.meta.url))
const PUBLICO = fileURLToPath(new URL('./public', import.meta.url))
const PLANTILLA_SW = fileURLToPath(new URL('./scripts/sw-plantilla.js', import.meta.url))

// Archivos de public/ (rutas relativas con /), excepto los que no sirven sin conexión.
function archivosPublicos(carpeta = PUBLICO): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre)
    if (statSync(ruta).isDirectory()) return archivosPublicos(ruta)
    const relativa = relative(PUBLICO, ruta).split('\\').join('/')
    return ['_headers', 'robots.txt'].includes(relativa) || relativa.endsWith('.txt') ? [] : [relativa]
  })
}

// Service worker para usar Savia sin internet: al compilar se genera sw.js con la lista de
// todos los archivos del sitio (incluido el banco de preguntas), para guardarlos en la
// primera visita. El nombre del caché cambia con el contenido, así una versión nueva
// reemplaza a la anterior.
function serviceWorker(): Plugin {
  return {
    name: 'savia-service-worker',
    apply: 'build',
    generateBundle(_opciones, paquete) {
      // Sin mapas de código ni fuentes que no hacen falta en español (otros alfabetos y el
      // formato .woff antiguo, que solo usan navegadores sin .woff2).
      const innecesario = (f: string) => f.endsWith('.map') || f.endsWith('.woff') || /-(vietnamese|cyrillic|cyrillic-ext|greek|greek-ext)-/.test(f)
      const archivos = [...Object.keys(paquete), ...archivosPublicos()].filter((f) => !innecesario(f)).sort()
      const huella = createHash('sha256').update(archivos.join('|')).update(readFileSync(BANCO)).digest('hex').slice(0, 10)
      const codigo = readFileSync(PLANTILLA_SW, 'utf8')
        .replace('__VERSION__', huella)
        .replace('__ARCHIVOS__', JSON.stringify(archivos.map((f) => (f === 'index.html' ? './' : './' + f))))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: codigo })
    },
  }
}

// Resumen de cada tema (cuántas preguntas y subtemas tiene) calculado al compilar, para
// mostrarlo en la portada sin descargar el banco completo de 1 000 preguntas.
function resumenTemas(): Plugin {
  const id = 'virtual:resumen-temas'
  const resuelto = '\0' + id
  return {
    name: 'savia-resumen-temas',
    resolveId: (fuente) => (fuente === id ? resuelto : undefined),
    load(fuente) {
      if (fuente !== resuelto) return
      this.addWatchFile(BANCO)
      const preguntas = JSON.parse(readFileSync(BANCO, 'utf8')) as { t: string; s: string }[]
      const temas: Record<string, { preguntas: number; subtemas: Map<string, number> }> = {}
      for (const { t, s } of preguntas) {
        temas[t] ??= { preguntas: 0, subtemas: new Map() }
        temas[t].preguntas++
        temas[t].subtemas.set(s, (temas[t].subtemas.get(s) ?? 0) + 1)
      }
      const resumen = Object.fromEntries(
        Object.entries(temas).map(([tema, { preguntas, subtemas }]) => [
          tema,
          {
            preguntas,
            // de más a menos preguntas
            subtemas: [...subtemas].sort((a, b) => b[1] - a[1]).map(([nombre, total]) => ({ nombre, total })),
          },
        ]),
      )
      return `export default ${JSON.stringify(resumen)}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), resumenTemas(), serviceWorker()],
})
