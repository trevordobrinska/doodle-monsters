import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative base so the build works under the GitHub Pages project path
  // (https://<user>.github.io/doodle-monsters/) without hard-coding the repo name.
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        // Throwaway Night 1 test page (ticket 02); remove after Night 1.
        night1: "night1/index.html",
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
