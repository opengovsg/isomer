import { defineConfig } from "@isomer/oxlint-config";
import base from "@isomer/oxlint-config/base";
import { antiSlop, core } from "@isomer/oxlint-config/presets";

export default defineConfig({
  extends: [base, core, antiSlop],
  ignorePatterns: [...core.ignorePatterns, "dist", "**/*.config.*", "!.storybook"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      plugins: ["typescript"],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
        "@typescript-eslint/no-non-null-assertion": "warn",
        "@typescript-eslint/no-unnecessary-condition": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/prefer-nullish-coalescing": [
          "error",
          {
            ignorePrimitives: true,
          },
        ],
        "@typescript-eslint/prefer-optional-chain": "warn",
        "no-unused-vars": "warn",
      },
    },
  ],
});
