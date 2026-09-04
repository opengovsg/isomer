import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDevelopment = process.env.NODE_ENV === "development"
const localPublishDir = path.join(__dirname, ".local-publish")

if (isDevelopment) {
  fs.mkdirSync(localPublishDir, { recursive: true })
  for (const entry of ["data", "schema", "sitemap.json"]) {
    const target = path.join(localPublishDir, entry)
    if (!fs.existsSync(target)) {
      fs.cpSync(path.join(__dirname, entry), target, { recursive: true })
    }
  }
}

/** @param {{ request: string }} resource */
const useLocalJson = (resource) => {
  resource.request = path.join(localPublishDir, resource.request.slice(2))
}

// `data/config.json` is written to disk (by the publisher) before `build:template` runs,
// so we can read it here to drive build-time module pruning.
const { site } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/config.json"), "utf-8"),
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isDevelopment ? undefined : "export",
  reactStrictMode: true,
  trailingSlash: true,
  // isomer-components → isomorphic-dompurify → jsdom. Declare those deps in package.json too so
  // Next resolves them the same from the app root as from the workspace package (pnpm); otherwise
  // Next may bundle jsdom and break __dirname (default-stylesheet.css ENOENT).
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  // No need as this only runs for packages of versions that passes in CI
  typescript: { ignoreBuildErrors: true },
  webpack(config, { webpack }) {
    if (isDevelopment) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^@\/(?:data\/.*\.json|schema(?:\/.*)?|sitemap\.json)$/,
          useLocalJson,
        ),
        new webpack.ContextReplacementPlugin(
          /[\\/]tooling[\\/]template[\\/]schema$/,
          path.join(localPublishDir, "schema"),
        ),
      )
    }

    // Site doesn't use egazette's Algolia-powered search: replace the module with a
    // null-stub so `algoliasearch`/`react-instantsearch` never enter the client bundle.
    // Applies to both the server and client compilers; a `() => null` stub is correct in both.
    if (!isDevelopment && site?.search?.type !== "egazette-algolia") {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]templates[\\/]next[\\/]layouts[\\/]Search[\\/]EgazetteAlgoliaSearch[\\/]index\.js$/,
          path.join(__dirname, "stubs/EgazetteAlgoliaSearch.js"),
        ),
      )
    }
    return config
  },
}

export default nextConfig
