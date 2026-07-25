import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      // SPA mode: semua navigasi fallback ke index.html
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/], // jangan intercept API calls
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Cache Backendless API — stale-while-revalidate agar cepat & tetap fresh
            urlPattern: ({ url }) =>
              url.hostname.includes("backendless.app"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "backendless-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 menit
              },
            },
          },
          {
            // Cache Google Fonts
            urlPattern: ({ url }) =>
              url.hostname.includes("fonts.googleapis.com") ||
              url.hostname.includes("fonts.gstatic.com"),
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 tahun
              },
            },
          },
        ],
      },
      manifest: {
        name: "Ayam Geprek Sriwedari",
        short_name: "Ayam Geprek Sriwedari",
        description: "Ayam Geprek Sriwedari",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
