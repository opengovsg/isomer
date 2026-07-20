import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// `data/config.json` is written to disk (by the publisher) before `build:template` runs,
// so we can read it here to drive build-time module pruning.
const { site } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/config.json"), "utf-8"),
)

// Component/layout types dispatched by `renderComponent.tsx`/`renderLayout.tsx`, mapped to
// their `@opengovsg/isomer-components` dist folder. Only types confirmed to have no
// cross-imports from outside those two dispatchers are listed — a handful of components/
// layouts are permanently excluded below because `NormalModuleReplacementPlugin` redirects by
// *resolved file path*, so stubbing them would also break unrelated internal importers:
//   - `infobar` (Infobar): imported directly by the NotFound layout for `createInfobarStyles`.
//   - `infocards` (InfoCards): imported directly by ChildrenPages for its styles/sub-components.
//   - `contactinformation` (ContactInformation): imported directly by DynamicComponentList.
//   - `prose` (Prose, native): imported directly by Callout, Accordion, Contentpic, and the
//     always-bundled internal Notification component.
//   - `collection` layout: its `utils/*` are imported directly by the Article layout and by
//     the CollectionBlock component.
//   - `notfound` layout: not a cross-import risk, but force-kept regardless of schema usage
//     since every site can hit its own 404 page even when no schema file declares it.
const COMPONENT_TARGETS = [
  ["accordion", "Accordion"],
  ["antiscambanner", "AntiScamDisclaimerBanner"],
  ["audio", "Audio"],
  ["blockquote", "Blockquote"],
  ["callout", "Callout"],
  ["childrenpages", "ChildrenPages"],
  ["collectionblock", "CollectionBlock"],
  ["contentpic", "Contentpic"],
  ["dynamiccomponentlist", "DynamicComponentList"],
  ["dynamicdatabanner", "DynamicDataBanner"],
  ["formsg", "FormSG"],
  ["hero", "Hero"],
  ["iframe", "Iframe"],
  ["image", "Image"],
  ["imagegallery", "ImageGallery"],
  ["infocols", "InfoCols"],
  ["infopic", "Infopic"],
  ["keystatistics", "KeyStatistics"],
  ["logocloud", "LogoCloud"],
  ["map", "Map"],
  ["video", "Video"],
].map(([schemaType, folder]) => ({
  schemaType,
  dir: `components/complex/${folder}`,
  kind: "components",
}))

const LAYOUT_TARGETS = [
  ["article", "Article"],
  ["content", "Content"],
  ["database", "Database"],
  ["homepage", "Homepage"],
  ["index", "IndexPage"],
  ["search", "Search"],
].map(([schemaType, folder]) => ({
  schemaType,
  dir: `layouts/${folder}`,
  kind: "layouts",
}))

// Walks every `schema/**/*.json` page file and collects which layout types and top-level
// `content[].type` component types the site actually uses, so unused ones can be stubbed out.
// Defensive by design: any failure (missing dir, malformed JSON, unexpected shape) returns
// `null`, and the caller skips pruning entirely rather than risk stubbing something in use.
function scanSchemaUsage() {
  try {
    const schemaDir = path.join(__dirname, "schema")
    const layouts = new Set()
    const components = new Set()

    /** @param {string} dir */
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(entryPath)
          continue
        }
        if (!entry.name.endsWith(".json")) continue

        const page = JSON.parse(fs.readFileSync(entryPath, "utf-8"))
        if (typeof page.layout === "string") layouts.add(page.layout)
        for (const block of page.content ?? []) {
          if (typeof block?.type === "string") components.add(block.type)
        }
        // IndexPageLayout.ensureChildrenPagesBlock() injects a `childrenpages` block at
        // render time for every "index"-layout page that doesn't already declare one, so it
        // must count as used even when the schema file itself never mentions it.
        if (page.layout === "index") components.add("childrenpages")
      }
    }
    walk(schemaDir)

    return { layouts, components }
  } catch {
    return null
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  // isomer-components → isomorphic-dompurify → jsdom. Declare those deps in package.json too so
  // Next resolves them the same from the app root as from the workspace package (pnpm); otherwise
  // Next may bundle jsdom and break __dirname (default-stylesheet.css ENOENT).
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  // No need as this only runs for packages of versions that passes in CI
  typescript: { ignoreBuildErrors: true },
  webpack(config, { webpack }) {
    // Site doesn't use egazette's Algolia-powered search: replace the module with a
    // null-stub so `algoliasearch`/`react-instantsearch` never enter the client bundle.
    // Applies to both the server and client compilers; a `() => null` stub is correct in both.
    if (site?.search?.type !== "egazette-algolia") {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]templates[\\/]next[\\/]layouts[\\/]Search[\\/]EgazetteAlgoliaSearch[\\/]index\.js$/,
          path.join(__dirname, "stubs/EgazetteAlgoliaSearch.js"),
        ),
      )
    }

    // Site-level component/layout tree-shaking: stub out any complex component or layout
    // type the site's schema never uses, so its render-time cost (and that of anything it
    // statically imports) never enters the client bundle. See `scanSchemaUsage` and
    // `COMPONENT_TARGETS`/`LAYOUT_TARGETS` above for exclusions and rationale.
    const usage = scanSchemaUsage()
    if (usage) {
      const stubPath = path.join(__dirname, "stubs/renderTargets.js")
      for (const { schemaType, dir, kind } of [
        ...COMPONENT_TARGETS,
        ...LAYOUT_TARGETS,
      ]) {
        const usageSet =
          kind === "components" ? usage.components : usage.layouts
        if (usageSet.has(schemaType)) continue

        const escapedDir = dir.replace(/[/]/g, "[\\\\/]")
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            new RegExp(
              `[\\\\/]templates[\\\\/]next[\\\\/]${escapedDir}[\\\\/]index\\.js$`,
            ),
            stubPath,
          ),
        )
      }
    }

    return config
  },
}

export default nextConfig
