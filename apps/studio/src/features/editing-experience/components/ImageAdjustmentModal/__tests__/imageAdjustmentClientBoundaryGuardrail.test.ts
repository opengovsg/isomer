import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

// Lives in Studio because the components build has no Node types.
const SRC_DIR = path.resolve(
  __dirname,
  "../../../../../../../../packages/components/src",
)
const COMPONENTS_DIR = path.join(SRC_DIR, "templates/next/components")
// ImageClientWithAdjustment resolves the adjustment itself, so stop there.
const IMAGE_CLIENT_DIR = path.join(COMPONENTS_DIR, "internal/ImageClient")

const listSourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(entryPath)
    return /\.tsx?$/.test(entry.name) && !/\.(stories|test)\./.test(entry.name)
      ? [entryPath]
      : []
  })

const resolveImport = (from: string, specifier: string) =>
  ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]
    .map((suffix) =>
      specifier.startsWith("~/")
        ? path.join(SRC_DIR, specifier.slice(2) + suffix)
        : path.resolve(path.dirname(from), specifier + suffix),
    )
    .find(
      (candidate) =>
        fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
    )

// Every file a "use client" file imports ships to the browser with its props.
const collectClientFiles = (): Set<string> => {
  const clientFiles = new Set<string>()
  const visit = (file: string) => {
    if (clientFiles.has(file) || !file.startsWith(COMPONENTS_DIR)) return
    if (file.startsWith(IMAGE_CLIENT_DIR)) return
    clientFiles.add(file)
    const source = fs.readFileSync(file, "utf-8")
    for (const [, specifier] of source.matchAll(
      /from\s+"((?:\.|~\/)[^"]+)"/g,
    )) {
      const resolved = resolveImport(file, specifier!)
      if (resolved) visit(resolved)
    }
  }
  listSourceFiles(COMPONENTS_DIR)
    .filter((file) =>
      /^\s*["']use client["']/.test(fs.readFileSync(file, "utf-8")),
    )
    .forEach(visit)
  return clientFiles
}

describe("imageAdjustment client boundary guardrail", () => {
  // An adjustment passed to a client component is serialised into the page
  // HTML, which exposes `originalKey`, the uncropped original. Resolve it on
  // the server with getFocalObjectPosition and pass `objectPosition` instead.
  it("no client component receives an imageAdjustment", () => {
    const offenders = [...collectClientFiles()]
      .filter((file) => /imageAdjustment/i.test(fs.readFileSync(file, "utf-8")))
      .map((file) => path.relative(COMPONENTS_DIR, file))
    expect(offenders).toEqual([])
  })
})
