import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base dinámica: staging => /v2-staging/, producción => /v2/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'staging' ? '/v2-staging/' : '/v2/',
}))
