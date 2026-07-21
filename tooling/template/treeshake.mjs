import fs from "node:fs"
import path from "node:path"

// Component/layout types dispatched by `renderComponent.tsx`/`renderLayout.tsx`, mapped to
// their `@opengovsg/isomer-components` dist folder. Only types confirmed to have no
// cross-imports from outside those two dispatchers are listed — a handful of components are
// permanently excluded below because `NormalModuleReplacementPlugin` redirects by *resolved
// file path*, so stubbing them would also break unrelated internal importers:
//   - `infobar` (Infobar): imported directly by the NotFound layout for `createInfobarStyles`.
//   - `infocards` (InfoCards): imported directly by ChildrenPages for its styles/sub-components.
//   - `contactinformation` (ContactInformation): imported directly by DynamicComponentList.
//   - `prose` (Prose, native): imported directly by Callout, Accordion, Contentpic, and the
//     always-bundled internal Notification component.
// The Collection layout used to be on this list too (its utils were imported directly by the
// Article layout and by CollectionBlock), until that shared logic moved to
// `packages/components/src/utils/collection/` -- Article and CollectionBlock now import from
// there instead of reaching into Collection's own folder, so Collection can be pruned like any
// other layout.
//   - `notfound` layout: not a cross-import risk, but force-kept regardless of schema usage
//     since every site can hit its own 404 page even when no schema file declares it.
/** @type {Array<[string, string]>} */
const COMPONENT_TARGET_PAIRS = [
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
]
export const COMPONENT_TARGETS = COMPONENT_TARGET_PAIRS.map(
  ([schemaType, folder]) => ({
    schemaType,
    dir: `components/complex/${folder}`,
    kind: "components",
  }),
)

/** @type {Array<[string, string]>} */
const LAYOUT_TARGET_PAIRS = [
  ["article", "Article"],
  ["collection", "Collection"],
  ["content", "Content"],
  ["database", "Database"],
  ["homepage", "Homepage"],
  ["index", "IndexPage"],
  ["search", "Search"],
]
export const LAYOUT_TARGETS = LAYOUT_TARGET_PAIRS.map(
  ([schemaType, folder]) => ({
    schemaType,
    dir: `layouts/${folder}`,
    kind: "layouts",
  }),
)

/**
 * @typedef {object} SchemaUsage
 * @property {Set<string>} layouts
 * @property {Set<string>} components
 */

// Walks every `schemaDir/**/*.json` page file and collects which layout types and top-level
// `content[].type` component types the site actually uses, so unused ones can be stubbed out.
// Defensive by design: any failure (missing dir, malformed JSON, unexpected shape) returns
// `null`, and the caller skips pruning entirely rather than risk stubbing something in use.
/**
 * @param {string} schemaDir
 * @returns {SchemaUsage | null}
 */
export function scanSchemaUsage(schemaDir) {
  try {
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

// Given a `scanSchemaUsage()` result, returns the dist-relative dir (e.g.
// "components/complex/Video") for every COMPONENT_TARGETS/LAYOUT_TARGETS entry the site
// doesn't use, i.e. every module safe to redirect to the shared no-op stub.
/**
 * @param {SchemaUsage} usage
 * @returns {string[]}
 */
export function getUnusedTargetDirs(usage) {
  return [...COMPONENT_TARGETS, ...LAYOUT_TARGETS]
    .filter(({ schemaType, kind }) => {
      const usageSet = kind === "components" ? usage.components : usage.layouts
      return !usageSet.has(schemaType)
    })
    .map(({ dir }) => dir)
}

// Builds the `NormalModuleReplacementPlugin` matcher for one target's dist dir, matching its
// `index.js` regardless of which OS path separator the resolved path uses.
/**
 * @param {string} dir
 * @returns {RegExp}
 */
export function buildStubRegex(dir) {
  const escapedDir = dir.replace(/[/]/g, "[\\\\/]")
  return new RegExp(
    `[\\\\/]templates[\\\\/]next[\\\\/]${escapedDir}[\\\\/]index\\.js$`,
  )
}
