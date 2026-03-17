import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    // Use "/" for Firebase Hosting, "/metadata-entry-form/" for GitHub Pages
    base: env.VITE_BASE_PATH || "/metadata-entry-form/",
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
