// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import baseConfig from "@isomer/eslint-config/base"
import reactConfig from "@isomer/eslint-config/react"

/** @type {import('typescript-eslint').Config} */
export default [{
  ignores: ["!.storybook", "dist"],
}, ...baseConfig, ...reactConfig, {
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
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "tailwind-variants",
            importNames: ["tv"],
            message:
              "Please use export from ~/lib/tv instead of the node module",
          },
          {
            name: "tailwind-merge",
            importNames: ["twMerge"],
            message:
              "Please use export from ~/lib/twMerge instead of the node module",
          },
          {
            name: "next/navigation",
            message: "Please use export from next instead of next/navigation",
          },
        ],
      },
    ],
  },
}, ...storybook.configs["flat/recommended"]];
