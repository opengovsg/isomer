import { defineConfig } from "oxlint"
import ultraciteVitest from "ultracite/oxlint/vitest"

/**
 * Isomer vitest preset: Ultracite defaults with strict boolean matchers.
 * Prefer `toBe(true)` / `toBe(false)` over weaker `toBeTruthy()` / `toBeFalsy()`.
 */
export default defineConfig({
  extends: [ultraciteVitest],
  overrides: [
    {
      files: [
        "**/*.{test,spec,test-d,spec-d}.{ts,tsx,js,jsx}",
        "**/__tests__/**/*.{ts,tsx,js,jsx}",
      ],
      plugins: ["vitest"],
      rules: {
        "vitest/prefer-to-be-truthy": "off",
        "vitest/prefer-to-be-falsy": "off",
        "vitest/prefer-strict-boolean-matchers": "error",
      },
    },
  ],
})
