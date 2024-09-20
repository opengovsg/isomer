import { fixupPluginRules } from "@eslint/compat"
import nextPlugin from "@next/eslint-plugin-next"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": fixupPluginRules(nextPlugin),
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
]
