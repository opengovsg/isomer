import baseConfig from "@isomer/eslint-config/base";
import reactConfig from "@isomer/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["!.storybook", "dist"],
  },
  ...baseConfig,
  ...reactConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    // TODO: Remove all the warn rules once errors are fixed
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
