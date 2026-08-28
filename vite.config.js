import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Mi Presupuesto",
        short_name: "Presupuesto",
        description: "Control personal de ingresos, gastos y ahorro",
        theme_color: "#080D18",
        background_color: "#080D18",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
          {
            src: "/pwa-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2,png}"]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
});
