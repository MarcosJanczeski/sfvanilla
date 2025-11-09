/// <reference lib="webworker" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

declare const self: ServiceWorkerGlobalScope

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: { /* carregamos do arquivo público; pode omitir aqui */ },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({url}) => url.origin === self.location.origin,
            handler: 'StaleWhileRevalidate'
          },
          {
            urlPattern: ({url}) => url.pathname.startsWith('/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 3 }
          }
        ]
      }
    })
  ]
})
