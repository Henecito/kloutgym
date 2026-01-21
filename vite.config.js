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
        name: "STDI Gymanager",
        short_name: "Gymanager",
        description: "Sistema de gestión Gymanager",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-icon192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-icon512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
