/// <reference lib="webworker" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Habilita SW também no dev (útil para testar cache/offline)
      devOptions: { enabled: true, type: "module" },
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "SF Vanilla",
        short_name: "SFV",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0ea5e9",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        runtimeCaching: [
          // cache do app shell
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: "StaleWhileRevalidate",
          },
          // cache das chamadas à API (quando usar proxy /api)
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkFirst",
            options: { cacheName: "api-cache", networkTimeoutSeconds: 4 },
          }
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",     // expõe na rede local
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: true,
    // Proxy: celular fala com /api e o Vite redireciona para a API local (3001)
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
});