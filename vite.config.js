import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served under /diatonic on the unified domain (Vercel multi-zone).
  base: '/diatonic/',
  plugins: [react()],
})
