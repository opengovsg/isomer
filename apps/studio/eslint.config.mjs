// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import baseConfig, { restrictEnvAccess } from "@isomer/eslint-config/base"
import nextjsConfig from "@isomer/eslint-config/nextjs"
import reactConfig from "@isomer/eslint-config/react"

/** @type {import('typescript-eslint').Config} */
export default [{
  ignores: [".next/**", "!.storybook/**"],
}, ...baseConfig, ...reactConfig, ...nextjsConfig, ...restrictEnvAccess, {
  files: ["**/*.ts", "**/*.tsx"],
  rules: {
    "@typescript-eslint/prefer-nullish-coalescing": [
      "error",
      { ignorePrimitives: true },
    ],
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@chakra-ui/react",
            importNames: ["useToast"],
            message:
              "Please use useToast from @opengovsg/design-system-react instead.",
          },
          {
            name: "@chakra-ui/react",
            importNames: ["FormLabel", "FormErrorMessage", "FormHelperText"],
            message:
              "Please use FormLabel, FormErrorMessage, and FormHelperText from @opengovsg/design-system-react instead.",
          },
        ],
      },
    ],
  },
}, ...storybook.configs["flat/recommended"]];
