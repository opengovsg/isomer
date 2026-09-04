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
      files: ["**/*.test.ts", "**/*.test.tsx"],
      plugins: ["vitest"],
      rules: {
        // Ultracite prefers toBeTruthy()/toBeFalsy(), which pass for any
        // truthy/falsy value. Flip that: require toBe(true)/toBe(false).
        "vitest/prefer-to-be-truthy": "off",
        "vitest/prefer-to-be-falsy": "off",
        "vitest/prefer-strict-boolean-matchers": "error",
        // Typed vi.mock(import(...)) and vi.fn<...>() improve mock IntelliSense, but
        // they fight tsgo in this repo: partial module mocks fail assignability checks,
        // and vi.fn<(...args: unknown[]) => unknown>() widens mocks to unknown.
        "vitest/prefer-import-in-mock": "off",
        "vitest/require-mock-type-parameters": "off",
        // Zod 4 schemas are objects, not Functions, so describe(schema) fails typecheck.
        // String titles that match the schema export name also trip this rule.
        "vitest/prefer-describe-function-title": "off",
      },
    },
  ],
})
