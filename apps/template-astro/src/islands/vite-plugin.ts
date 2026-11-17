// Build-time half of the islands runtime (see ./README.md for the end-to-end flow).
//
// 1. Server: when page code imports a "use client" module from isomer-components, swap the import
//    for a generated module that wraps each exported component with renderIsland().
// 2. Browser: provide `virtual:isomer-islands`, a map of lazy loaders (one per client module) that
//    hydrate-islands.ts uses to download only the islands present on the page.
import type { Plugin } from "vite"
import fs from "node:fs"
import path from "node:path"

const REGISTRY_ID = "virtual:isomer-islands"
const RESOLVED_REGISTRY_ID = "\0" + REGISTRY_ID
// Prefix for the generated wrapper modules: "\0isomer-island:/abs/path/to/Navbar.js".
const WRAPPER_PREFIX = "\0isomer-island:"
const RENDER_ISLAND = path.join(import.meta.dirname, "render-island.ts")

// Vite reports real paths, so resolve the pnpm symlink once.
const COMPONENTS_DIST = path.join(
  fs.realpathSync(
    path.join(process.cwd(), "node_modules/@opengovsg/isomer-components"),
  ),
  "dist/esm",
)

// "use client" modules that render as plain HTML instead of becoming islands, because their
// client behaviour is unnecessary without Next or is re-implemented in static-behaviours.js.
const NO_HYDRATION: Record<string, string> = {
  "templates/next/components/internal/Link/Link.js":
    "only reads LinkComponentContext, which defaults to a plain <a>",
  "templates/next/context/LinkComponentContext.js": "context only, no UI",
  "templates/next/components/internal/ScrollToTop.js":
    "works around next/link scrolling; there is no client router here",
  "templates/next/components/internal/Footer/ClientCopyright.js":
    "client-side year; rendered at build time instead",
  "templates/next/components/internal/ImageClient/ImageClient.js":
    "onError placeholder swap lives in static-behaviours.js",
  "templates/next/components/internal/BackToTopLink.js":
    "scroll-to-top click lives in static-behaviours.js",
}

// Stable id for a module, e.g. "templates/next/components/internal/Navbar/NavbarClient.js".
const moduleKey = (file: string) => path.relative(COMPONENTS_DIST, file)

// ---------------------------------------------------------------------------------------------
// Finding client modules
// ---------------------------------------------------------------------------------------------

const clientModuleCache = new Map<string, boolean>()

/** True for isomer-components dist files that start with "use client". */
const isClientModule = (file: string): boolean => {
  if (!file.startsWith(COMPONENTS_DIST) || !file.endsWith(".js")) return false
  let isClient = clientModuleCache.get(file)
  if (isClient === undefined) {
    const firstLine = fs.readFileSync(file, "utf8").slice(0, 32)
    isClient = /^["']use client["']/.test(firstLine)
    clientModuleCache.set(file, isClient)
  }
  return isClient
}

const isIsland = (file: string) =>
  isClientModule(file) && !(moduleKey(file) in NO_HYDRATION)

/**
 * Exported component names of a dist module. Hooks (useX) and lowercase helpers are skipped.
 * tsc only emits `export const X`, `export function X` and `export { A, B as C }`.
 */
const componentExports = (file: string) => {
  const code = fs.readFileSync(file, "utf8")
  const declared = [...code.matchAll(/^export (?:const|function) (\w+)/gm)].map(
    (match) => match[1],
  )
  const listed = [...code.matchAll(/^export \{([^}]*)\}/gm)]
    .flatMap((match) => (match[1] ?? "").split(","))
    .map((specifier) =>
      specifier
        .trim()
        .split(/\s+as\s+/)
        .pop(),
    )
  return [...declared, ...listed].filter(
    (name): name is string => !!name && /^[A-Z]/.test(name),
  )
}

const allIslandModules = (dir = COMPONENTS_DIST): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) return allIslandModules(file)
    return isIsland(file) && componentExports(file).length > 0 ? [file] : []
  })

// ---------------------------------------------------------------------------------------------
// Generated modules
// ---------------------------------------------------------------------------------------------

/** Re-exports a client module with every component wrapped by renderIsland(). */
const wrapperModule = (file: string) => {
  const wrapped = componentExports(file).map((name) => {
    const islandKey = JSON.stringify(`${moduleKey(file)}#${name}`)
    return `export const ${name} = renderIsland(original.${name}, ${islandKey})`
  })
  return [
    `import { renderIsland } from ${JSON.stringify(RENDER_ISLAND)}`,
    `import * as original from ${JSON.stringify(file)}`,
    // Non-component exports (hooks, constants) pass through; the wrapped names shadow these.
    `export * from ${JSON.stringify(file)}`,
    ...wrapped,
  ].join("\n")
}

/** `export const loaders = { "<module key>": () => import("<file>"), ... }` */
const registryModule = () => {
  const entries = allIslandModules().map(
    (file) =>
      `  ${JSON.stringify(moduleKey(file))}: () => import(${JSON.stringify(file)}),`,
  )
  return `export const loaders = {\n${entries.join("\n")}\n}\n`
}

// ---------------------------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------------------------

export const isomerIslands = (): Plugin => ({
  name: "isomer-islands",
  enforce: "pre",

  async resolveId(source, importer, options) {
    if (source === REGISTRY_ID) return RESOLVED_REGISTRY_ID
    if (!importer || this.environment.config.consumer !== "server") return null
    // The wrapper's own import of the original module must not be wrapped again.
    if (importer.startsWith(WRAPPER_PREFIX)) return null
    // Client -> client imports stay inside that island's tree, as with Next's "use client".
    if (isClientModule(importer)) return null

    const resolved = await this.resolve(source, importer, {
      ...options,
      skipSelf: true,
    })
    return resolved && isIsland(resolved.id)
      ? WRAPPER_PREFIX + resolved.id
      : null
  },

  load(id) {
    if (id === RESOLVED_REGISTRY_ID) return registryModule()
    if (id.startsWith(WRAPPER_PREFIX))
      return wrapperModule(id.slice(WRAPPER_PREFIX.length))
    return null
  },
})
