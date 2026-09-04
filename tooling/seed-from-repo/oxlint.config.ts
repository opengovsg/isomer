import { defineConfig } from "oxlint";
import base from "@isomer/oxlint-config/base";

export default defineConfig({
  extends: [base],
  ignorePatterns: ["!.storybook"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-non-null-assertion": "warn",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
        "@typescript-eslint/prefer-optional-chain": "warn",
        "@typescript-eslint/prefer-nullish-coalescing": [
          "error",
          {
            ignorePrimitives: true,
          },
        ],
        "@typescript-eslint/no-unnecessary-condition": "warn",
        "no-unused-vars": "warn",
      },
      plugins: ["typescript"],
    },
  ],
});
