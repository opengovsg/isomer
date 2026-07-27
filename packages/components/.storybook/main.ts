import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "storybook-addon-pseudo-states",
    "@storybook/addon-docs",
  ],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  staticDirs: ["../public", "./assets"],

  viteFinal: (config) => {
    // Workaround for a rolldown (Vite 8 bundler) codegen bug: with
    // strictExecutionOrder (force-enabled by @storybook/builder-vite),
    // circular value-imports among src/{types,interfaces,schemas} make
    // rolldown emit lazily-initialised (__esm-wrapped) modules whose
    // cross-chunk bindings (e.g. typebox's `Type`) are never imported,
    // throwing "ReferenceError: Type is not defined" at runtime. Disable it
    // via a post-enforced plugin (builder-vite re-enables it in a pre plugin
    // config hook, which runs after viteFinal). Only affects the Storybook
    // build; the published package build uses tsc and is unaffected.
    config.plugins ??= []
    config.plugins.push({
      name: "isomer:disable-strict-execution-order",
      enforce: "post",
      config: (cfg) => {
        const output = (
          cfg.build as
            | { rolldownOptions?: { output?: Record<string, unknown> } }
            | undefined
        )?.rolldownOptions?.output
        if (output && !Array.isArray(output)) {
          output.strictExecutionOrder = false
        }
      },
    })
    return config
  },
}

export default config
