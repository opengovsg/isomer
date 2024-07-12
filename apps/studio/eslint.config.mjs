// @ts-expect-error typescript somehow cannot find types
import baseConfig, { restrictEnvAccess } from "@isomer/eslint-config/base"
// @ts-expect-error typescript somehow cannot find types
import nextjsConfig from "@isomer/eslint-config/nextjs"
// @ts-expect-error typescript somehow cannot find types
import reactConfig from "@isomer/eslint-config/react"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**", "!.storybook/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
  {
    files: ["**/*.ts", "**/*.tsx"],
    // TODO: Remove all the warn rules once errors are fixed
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: true },
      ],
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/unbound-method": "warn",
    },
  },
]
