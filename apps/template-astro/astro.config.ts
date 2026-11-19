import { defineConfig } from "astro/config"
import { fileURLToPath } from "node:url"
import postcssPresetEnv from "postcss-preset-env"
import tailwindcss from "tailwindcss"

// Preact renders the site on the server and in the browser. Every "react" import goes through
// src/islands/react.ts, which imports preact/compat.
const REACT = fileURLToPath(new URL("src/islands/react.ts", import.meta.url))
const PREACT_ALIASES: Record<string, string> = {
  "react-dom/server": "preact/compat/server",
  "react-dom/client": "preact/compat/client",
  "react-dom": "preact/compat",
  "react/jsx-runtime": "preact/jsx-runtime",
  "react/jsx-dev-runtime": "preact/jsx-dev-runtime",
  react: "preact/compat",
}

export default defineConfig({
  output: "static",
  outDir: "out",
  trailingSlash: "always",
  build: { format: "directory", assets: "_isomer" },
  prefetch: false,
  devToolbar: { enabled: false },
  experimental: {
    parallelPrerender: true,
  },
  vite: {
    // isomer-components is a linked workspace package: without this, dev loads React twice.
    resolve: { dedupe: ["react", "react-dom"] },
    // Libraries that import React, bundled so they get Preact on the server too.
    ssr: {
      noExternal: [
        /^@react-aria\//,
        /^react-aria/,
        /^@react-stately\//,
        /^@headlessui\//,
        /^react-icons/,
        /^react-instantsearch/,
        /^instantsearch/,
        /^interweave/,
        /^usehooks-ts/,
        /^use-sync-external-store/,
      ],
    },
    css: { postcss: { plugins: [tailwindcss(), postcssPresetEnv()] } },
    plugins: [
      {
        // resolve.alias can't be scoped to one environment.
        name: "isomer-react",
        enforce: "pre",
        resolveId(source, importer, options) {
          if (source === "react" && importer !== REACT) return REACT
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
