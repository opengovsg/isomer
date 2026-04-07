import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    exclude: [...configDefaults.exclude],

    coverage: {
      provider: "istanbul",
      reportOnFailure: true,
    },
  },
})
