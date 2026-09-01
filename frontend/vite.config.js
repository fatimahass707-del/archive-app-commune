import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "نظام الأرشفة الإلكترونية للجماعة",
        short_name: "الأرشيف الرقمي",
        theme_color: "#1b2a4a",
        background_color: "#f6f7f6",
        display: "standalone",
        start_url: "/",
        dir: "rtl",
        lang: "ar",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^\/uploads\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
  preview: {
    port: 5173,
  },
});
