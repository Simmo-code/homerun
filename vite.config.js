import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change 'homerun' to your GitHub repo name when deploying
export default defineConfig({
  base: '/homerun/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
})
