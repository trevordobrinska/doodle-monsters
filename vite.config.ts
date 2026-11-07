import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative base so the build works under the GitHub Pages project path
  // (https://<user>.github.io/doodle-monsters/) without hard-coding the repo name.
  base: "./",
  test: {
    include: ["src/**/*.test.ts"],
  },
});
