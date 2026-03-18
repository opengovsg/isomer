import { fileURLToPath } from "url"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: [
      ...configDefaults.exclude,
      "**/playwright/**",
      "tests/load/**",
    ],
    alias: {
      "~/": fileURLToPath(new URL("./src/", import.meta.url)),
    },
    coverage: {
      provider: "istanbul",
      reportOnFailure: true,
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/__tests__/**",
        "**/__test__/**",
        "**/{dist,build,.next,.turbo,coverage,storybook-static}/**",
      ],
    },
  },
})
