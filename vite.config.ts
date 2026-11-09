import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const BANCO = fileURLToPath(new URL('./src/data/preguntas.json', import.meta.url))

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
  plugins: [react(), resumenTemas()],
})
