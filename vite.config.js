import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/v2/',          // MUY IMPORTANTE para que los assets apunten a /v2/assets/...
  plugins: [react()]
})

