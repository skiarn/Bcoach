import type { IncomingMessage } from 'node:http'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'base-redirect',
      configurePreviewServer(server) {
        server.middlewares.use((req: IncomingMessage, _res, next) => {
          if (req.url === '/Bcoach') {
            req.url = '/Bcoach/'
          }
          next()
        })
      },
    },
  ],
  base: '/Bcoach/',
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core'],
  },
})