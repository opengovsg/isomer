import baseConfig from "@isomer/eslint-config/base"
import nextjsConfig from "@isomer/eslint-config/nextjs"
import reactConfig from "@isomer/eslint-config/react"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**", "!.storybook/**", "out/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": "allow-with-description",
        },
      ],
    },
  },
]
