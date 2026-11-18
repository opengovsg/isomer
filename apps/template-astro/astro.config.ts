import { defineConfig } from "astro/config"
import { fileURLToPath } from "node:url"
import postcssPresetEnv from "postcss-preset-env"
import tailwindcss from "tailwindcss"

// Every "react" import goes through src/islands/react.ts, which then imports the real one:
// React on the server, preact/compat in the browser.
const REACT = fileURLToPath(new URL("src/islands/react.ts", import.meta.url))
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
    // Bundled, so react-aria's ids also go through src/islands/react.ts on the server.
    ssr: { noExternal: [/^@react-aria\//, /^react-aria/] },
    css: { postcss: { plugins: [tailwindcss(), postcssPresetEnv()] } },
    plugins: [
      {
        // resolve.alias can't be scoped to one environment.
        name: "isomer-react",
        enforce: "pre",
        resolveId(source, importer, options) {
          if (source === "react" && importer !== REACT) return REACT
          const target =
            this.environment.name === "client"
              ? PREACT_ALIASES[source]
              : undefined
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
