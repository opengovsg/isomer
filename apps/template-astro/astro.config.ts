import { defineConfig } from "astro/config"
import postcssPresetEnv from "postcss-preset-env"
import tailwindcss from "tailwindcss"

// Production client bundles only: SSR stays React, and dev / --devOutput builds keep React's
// development build, which reports hydration mismatches.
const PREACT_ALIASES: Record<string, string> = {
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
    css: { postcss: { plugins: [tailwindcss(), postcssPresetEnv()] } },
    plugins: [
      {
        // resolve.alias can't be scoped to one environment.
        name: "isomer-preact-client",
        enforce: "pre",
        applyToEnvironment: (env) =>
          env.name === "client" && process.env.NODE_ENV === "production",
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
