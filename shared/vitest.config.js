import { defineConfig } from "vitest/config";

// shared/ is plain ESM JavaScript with no framework dependency, so it needs no
// jsdom and no setup files — that is the whole point of the package.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.js"],
  },
});
