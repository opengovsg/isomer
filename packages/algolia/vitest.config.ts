import { fileURLToPath } from "node:url"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "~/": fileURLToPath(new URL("src/", import.meta.url)),
    },
  },
  test: {
    coverage: {
      exclude: [
        "**/__test__/**",
        "**/*.test.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
        "**/*.d.ts",
      ],
      include: ["src/**/*.{ts,tsx}"],
      provider: "istanbul",
      reportOnFailure: true,
    },
    dir: "src",
    exclude: [...configDefaults.exclude],
    globals: true,
  },
})
