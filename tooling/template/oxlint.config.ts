import { defineConfig } from "@isomer/oxlint-config"
import base from "@isomer/oxlint-config/base"
import {
  antiSlop,
  antiSlopJsPluginEntries,
  jsPluginSettings,
  next,
  react,
  reactDoctor,
  reactDoctorJsPluginEntries,
} from "@isomer/oxlint-config/presets"

export default defineConfig({
  extends: [
    base,
    react,
    reactDoctor,
    next,
    antiSlop,
    // To enable this in following stacked PRs
    // vitest
  ],
  // Oxlint does not merge `settings` or `jsPlugins` from extended configs.
  settings: jsPluginSettings,
  jsPlugins: [...reactDoctorJsPluginEntries, ...antiSlopJsPluginEntries],
  ignorePatterns: [".next/**", "!.storybook/**", "out/**"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        "react/react-in-jsx-scope": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        "@typescript-eslint/ban-ts-comment": [
          "error",
          {
            "ts-ignore": "allow-with-description",
          },
        ],
      },
      globals: {
        React: "writable",
      },
      plugins: ["react", "nextjs", "typescript"],
    },
  ],
})
