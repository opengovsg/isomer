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
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.browser.test.ts",
        "**/*.browser.test.tsx",
      ],
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
        // Intentional todos/skips are common in this repo; do not require per-line disables.
        "vitest/warn-todo": "off",
        "vitest/no-disabled-tests": "off",
        // Dummy matchers like toThrow(/./) or empty toHaveBeenCalledWith() are worse than off.
        "vitest/require-to-throw-message": "off",
        "vitest/prefer-called-with": "off",
        // Splitting one test into nested describes with Act in beforeEach does not improve tests.
        "vitest/max-expects": "off",
        "vitest/prefer-called-exactly-once-with": "off",
        "vitest/prefer-each": "off",
        "vitest/expect-expect": [
          "error",
          {
            assertFunctionNames: [
              "expect",
              "expectTypeOf",
              "assert",
              "assertType",
              "assertAuditLog",
              "assertAuditLogRows",
            ],
          },
        ],
      },
    },
    {
      // Playwright e2e tests match `*.test.ts` but are not Vitest.
      files: ["**/tests/e2e/**"],
      plugins: ["vitest"],
      rules: {
        "vitest/prefer-importing-vitest-globals": "off",
        "vitest/prefer-strict-boolean-matchers": "off",
        "vitest/prefer-to-be-truthy": "off",
        "vitest/prefer-to-be-falsy": "off",
        "vitest/prefer-describe-function-title": "off",
        "vitest/max-expects": "off",
        "vitest/require-to-throw-message": "off",
        "vitest/prefer-called-with": "off",
        "vitest/warn-todo": "off",
        "vitest/no-disabled-tests": "off",
        "vitest/prefer-called-once": "off",
        "vitest/padding-around-test-blocks": "off",
      },
    },
  ],
})
