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
    rules: {
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: true },
      ],
    },
  },
]
