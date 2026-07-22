import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      VitePWA({
        // prompt (not autoUpdate): an unprompted reload could destroy an
        // in-progress form; PWAUpdatePrompt surfaces the refresh instead
        registerType: "prompt",
        includeAssets: ["favicon.ico", "robots.txt", "favicons/*.ico"],
        manifest: {
          name: "CIOOS Metadata Entry Form",
          short_name: "CIOOS Forms",
          description:
            "Metadata intake form for the Canadian Integrated Ocean Observing System",
          theme_color: "#52a79b",
          background_color: "#ffffff",
          display: "standalone",
          start_url: ".",
          icons: [
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // the main chunk is >5MB; the default 2MiB limit would silently
          // leave it out of the precache
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
          // NEVER serve the SPA shell for the API — and never add runtime
          // caching for /api: auth and data must always hit the network.
          // (Auth lives under /api/v1/auth, already covered by /^\/api\//.)
          navigateFallback: "index.html",
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/,
              handler: "CacheFirst",
              options: {
                cacheName: "osm-tiles",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    // Self-hosted deployments serve from the root; override for sub-path hosting
    base: env.VITE_BASE_PATH || "/",
    assetsInclude: ["**/*.j2"],
    define: {
      // use-debounce reads global.document when flushOnExit is set
      global: "globalThis",
    },
    build: {
      outDir: "build",
      sourcemap: true,
    },
    server: {
      port: 3000,
      host: true,
      open: true,
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      // Self-hosted dev stack (docker-compose.dev.yml): same-origin API.
      // Auth now lives under /api/v1/auth, so only /api needs proxying.
      proxy: {
        "/api": env.VITE_API_PROXY_TARGET || "http://localhost:3001",
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/setupTests.js"],
      include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        include: ["src/**/*.{js,jsx}"],
        exclude: [
          "src/index.jsx",
          "src/setupTests.js",
          "**/node_modules/**",
          "**/__tests__/**",
          "**/__mocks__/**",
        ],
        thresholds: {
          branches: 80,
          functions: 90,
          lines: 95,
          statements: 90,
        },
      },
    },
  };
});
