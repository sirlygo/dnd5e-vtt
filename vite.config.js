import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Change 'dnd5e-vtt' to your actual GitHub repo name
  base: '/dnd5e-vtt/',
})
