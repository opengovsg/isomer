import baseConfig, { restrictEnvAccess } from "@isomer/eslint-config/base";
import nextjsConfig from "@isomer/eslint-config/nextjs";
import reactConfig from "@isomer/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**", "!.storybook/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
