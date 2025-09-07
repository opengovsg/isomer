import baseConfig from "@isomer/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist"],
  },
  ...baseConfig,
  {
    files: ["**/*.ts"],
  },
];
