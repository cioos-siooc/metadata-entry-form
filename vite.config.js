import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
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
      // Self-hosted dev stack (docker-compose.dev.yml): same-origin API + auth
      proxy: {
        "/api": env.VITE_API_PROXY_TARGET || "http://localhost:3001",
        "/auth": env.VITE_AUTH_PROXY_TARGET || "http://localhost:8080",
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
          "src/index.js",
          "src/setupTests.js",
          "src/serviceWorker.js",
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
