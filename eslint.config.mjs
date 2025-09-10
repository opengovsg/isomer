import baseConfig from "@isomer/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: [
          "./apps/*/tsconfig.json",
          "./packages/*/tsconfig.json",
          "./tooling/*/tsconfig.json",
        ],
        tsconfigRootDir: import.meta.dirname, // makes globs resolve correctly
      },
    },
  },
];
