/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
module.exports = {
  bracketSpacing: true,
  semi: false,
  singleQuote: false,
  useTabs: false,
  // Plugins apply to all files except .d.ts: @ianvs/prettier-plugin-sort-imports
  // treats `import("pkg")` in type positions like real imports and breaks printing
  // for ambient declaration modules (Prettier crash: reading 'type' in estree).
  overrides: [
    {
      files: ["**/*"],
      excludeFiles: ["**/*.d.ts", "**/*.d.mts", "**/*.d.cts"],
      options: {
        plugins: [
          "@ianvs/prettier-plugin-sort-imports",
          "prettier-plugin-tailwindcss",
        ],
        tailwindFunctions: ["tv"],
        importOrder: [
          "<TYPES>",
          "^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
          "^(next/(.*)$)|^(next$)",
          "^(expo(.*)$)|^(expo$)",
          "<THIRD_PARTY_MODULES>",
          "",
          "<TYPES>^@isomer",
          "^@isomer/(.*)$",
          "",
          "<TYPES>^[.|..|~]",
          "^~/",
          "^[../]",
          "^[./]",
        ],
        importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
        importOrderTypeScriptVersion: "5.5.3",
      },
    },
  ],
}
