import type { StorybookConfig } from "@storybook/nextjs"

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],

  framework: {
    name: "@storybook/nextjs",
    options: {},
  },

  docs: {},

  staticDirs: ["../public"],

  core: {
    disableTelemetry: true,
  },

  env: (config) => ({
    ...config,
    SKIP_ENV_VALIDATION: "true",
    STORYBOOK_ENVIRONMENT: JSON.stringify(process.env),
  }),

  typescript: {
    check: false,
    skipCompiler: false,
    reactDocgen: "react-docgen-typescript",
  },

  // Force Storybook to use the same React version as the app, as it defaults
  // to using React 19 when using Next.js 15. We require React 18 due to
  // react-input-mask used by OGP's design system, which uses findDOMNode which
  // has been removed in React 19.
  // Ref: https://github.com/storybookjs/storybook/issues/30646
  webpackFinal: (config) => {
    const unaliases = [
      "react",
      "react-dom/test-utils",
      "react-dom$",
      "react-dom/client",
      "react-dom/server",
    ]
    if (config.resolve?.alias) {
      for (const unalias of unaliases) {
        // @ts-expect-error to fix when types are proper
        delete config.resolve.alias[unalias]
      }
    }
    // filenamify@6 (and other packages) use node: scheme imports which webpack 5
    // can't handle by default. resolve.alias is bypassed for node: URIs — only
    // hooking normalModuleFactory.beforeResolve rewrites them in time.
    config.plugins = [
      ...(config.plugins ?? []),
      {
        apply(compiler: {
          hooks: {
            normalModuleFactory: {
              tap: (
                name: string,
                fn: (nmf: {
                  hooks: {
                    beforeResolve: {
                      tap: (
                        name: string,
                        fn: (data: { request: string }) => void,
                      ) => void
                    }
                  }
                }) => void,
              ) => void
            }
          }
        }) {
          compiler.hooks.normalModuleFactory.tap("NodeSchemePlugin", (nmf) => {
            nmf.hooks.beforeResolve.tap("NodeSchemePlugin", (data) => {
              if (data.request.startsWith("node:")) {
                data.request = data.request.replace(/^node:/, "")
              }
            })
          })
        },
      },
    ]
    return config
  },
}
export default config
