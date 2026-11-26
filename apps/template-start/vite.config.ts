import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Trailing slashes match Next `trailingSlash: true` export layout. */
const prerenderPaths = ["/", "/about/"]

export default defineConfig({
  resolve: {},
  ssr: {
    noExternal: ["@opengovsg/isomer-components", "@isomer/validators"],
  },
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      target: "static",
      prerender: {
        enabled: true,
        crawlLinks: false,
        failOnError: true,
      },
      pages: prerenderPaths.map((routePath) => ({ path: routePath })),
      sitemap: {
        host: "https://example.isomer.gov.sg",
      },
    }),
    react(),
  ],
  css: {
    postcss: path.join(__dirname, "postcss.config.mjs"),
  },
})
