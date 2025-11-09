/// <reference lib="webworker" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false }, // pode ligar p/ testar SW: true
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
          { urlPattern: ({ url }) => url.origin === self.location.origin, handler: "StaleWhileRevalidate" },
          { urlPattern: ({ url }) => url.pathname.startsWith("/api"), handler: "NetworkFirst", options: { cacheName: "api-cache", networkTimeoutSeconds: 4 } }
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: true, // libera trycloudflare/ngrok/etc
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, "")
      }
    }
  }
});
