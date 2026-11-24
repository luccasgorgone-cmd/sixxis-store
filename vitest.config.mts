import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Só o alias `@/` do tsconfig — permite testar route handlers (que importam
// `@/lib/...`) sem mudar o comportamento dos testes existentes.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
