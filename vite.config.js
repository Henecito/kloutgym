import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true
      },
      manifest: {
        name: "Klout Gym",
        short_name: "Klout",
        description: "Sistema de gestión Klout Gym",
        theme_color: "#0a0c10",
        background_color: "#0a0c10",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-icon.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-icon.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
