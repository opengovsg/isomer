import baseConfig from "@isomer/eslint-config/base"
import nextjsConfig from "@isomer/eslint-config/nextjs"
import reactConfig from "@isomer/eslint-config/react"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**", "!.storybook/**", "out/**", "scripts/**"],
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
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["^@opengovsg/isomer-components$"],
              message:
                "Import from subpaths directly (e.g., '@opengovsg/isomer-components/templates/next') to improve Next.js tree-shaking. Root imports are not allowed.",
            },
          ],
        },
      ],
    },
  },
]
