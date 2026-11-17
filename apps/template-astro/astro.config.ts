import { defineConfig } from "astro/config"
import postcssPresetEnv from "postcss-preset-env"
import tailwindcss from "tailwindcss"

import { isomerIslands } from "./src/islands/vite-plugin"

// Islands hydrate with preact/compat in the browser (~35 KB smaller than react-dom); SSR always
// stays React. ISLANDS_RUNTIME=react is the fallback if a component misbehaves under compat.
// Build only: `astro dev` pre-bundles deps outside the plugin pipeline, so dev hydrates with React.
const PREACT_ALIASES: Record<string, string> = {
  "react-dom/client": "preact/compat/client",
  "react-dom": "preact/compat",
  "react/jsx-runtime": "preact/jsx-runtime",
  "react/jsx-dev-runtime": "preact/jsx-dev-runtime",
  react: "preact/compat",
}
const USE_PREACT = process.env.ISLANDS_RUNTIME !== "react"

export default defineConfig({
  output: "static",
  outDir: "out",
  trailingSlash: "always",
  build: { format: "directory", assets: "_isomer" },
  // No client router, prefetch or dev toolbar: islands/hydrate-islands.ts is the only first-party JS.
  prefetch: false,
  devToolbar: { enabled: false },
  // ASTRO_PARALLEL_PRERENDER=1 renders pages across worker threads (Astro 7.4+).
  experimental: {
    parallelPrerender: process.env.ASTRO_PARALLEL_PRERENDER === "1",
  },
  vite: {
    // isomer-components is a linked workspace package; without this, dev loads a second React.
    resolve: { dedupe: ["react", "react-dom"] },
    css: { postcss: { plugins: [tailwindcss(), postcssPresetEnv()] } },
    // Bundle everything into the SSR build: isomerIslands must see isomer-components' internal
    // imports, and bare imports left in out/.prerender resolve from the app root, where pnpm
    // doesn't expose isomer-components' own deps (react would otherwise load twice).
    // Astro 7 prerenders in its own `prerender` environment, which top-level `ssr` doesn't reach.
    plugins: [
      isomerIslands(),
      {
        name: "isomer-bundle-server-deps",
        // Dev runs deps straight from node_modules (CJS like react can't go through Vite's
        // module runner), so only isomer-components itself needs to pass through isomerIslands.
        configEnvironment: (name, _config, { command }) =>
          name === "client"
            ? undefined
            : {
                resolve: {
                  noExternal:
                    command === "build"
                      ? true
                      : ["@opengovsg/isomer-components"],
                  external: ["isomorphic-dompurify", "jsdom"],
                },
              },
      },
      {
        // resolve.alias can't be scoped to one environment, so swap React in resolveId instead.
        name: "isomer-preact-client",
        enforce: "pre",
        applyToEnvironment: (env) =>
          env.name === "client" && env.config.command === "build" && USE_PREACT,
        resolveId(source, importer, options) {
          const target = PREACT_ALIASES[source]
          return target
            ? this.resolve(target, import.meta.dirname + "/package.json", {
                ...options,
                skipSelf: true,
              })
            : null
        },
      },
    ],
  },
})
