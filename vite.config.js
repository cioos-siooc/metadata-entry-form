import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: "/metadata-entry-form/",
  assetsInclude: ["**/*.j2"],
  resolve: {
    alias: {
      stream: "stream-browserify",
      buffer: "buffer",
      util: "util",
      path: "path-browserify",
      crypto: "crypto-browserify",
      http: "stream-http",
      https: "https-browserify",
      querystring: "querystring-es3",
      url: "url",
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["buffer"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
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
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
}));
