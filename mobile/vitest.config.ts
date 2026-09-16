import path from "node:path";
import { defineConfig } from "vitest/config";

// Logic-only tests. Component tests will need a React Native preset; these
// cover the catalogues and other pure modules, which is where the bilingual
// guarantees live.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
