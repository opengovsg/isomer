import globals from "globals"

import baseConfig from "../eslint/base.js"

/** @type {import('typescript-eslint').Config} */
export default [
  ...baseConfig,
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      globals: { ...globals.node, performance: "readonly" },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "script",
      },
    },
    rules: {
      "no-useless-escape": "warn",
    },
  },
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
    },
  },
]
