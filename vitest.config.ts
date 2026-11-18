import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Las pruebas usan la misma configuración de Vite (incluido el resumen de temas) y un DOM
// simulado, porque la lógica guarda el progreso en localStorage.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts'],
      restoreMocks: true,
    },
  }),
)
