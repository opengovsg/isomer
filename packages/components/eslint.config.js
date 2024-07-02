import baseConfig from "@isomer/eslint-config/base";
import reactConfig from "@isomer/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["!.storybook"],
  },
  ...baseConfig,
  ...reactConfig,
];
