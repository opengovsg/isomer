import { spawnSync } from "node:child_process"
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { seedPublishingSite, TEST_DB_ENV, db } from "../seed"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_DIR = join(__dirname, "..", "..")
const TSX_BIN = join(PACKAGE_DIR, "node_modules", ".bin", "tsx")

// publisher.sh moves the script output into the template before building, so
// the template's committed placeholder fixtures are swapped for the real
// output here and restored afterwards
const TEMPLATE_DIR = join(PACKAGE_DIR, "..", "..", "..", "template")
const OUT_DIR = join(TEMPLATE_DIR, "out")
const HEAVY_ROUTES_DIR = join(TEMPLATE_DIR, "app", "(heavy)")
const HEAVY_ROUTES_MANIFEST = join(TEMPLATE_DIR, ".generated-heavy-routes.json")
const SWAPPED_PATHS = ["schema", "data", "sitemap.json"]

let outputDir: string
let backupDir: string | undefined
let restored = false

// Idempotent so it can run both on beforeAll failure and in afterAll.
// If the process is killed mid-build, `git checkout tooling/template` restores
// the fixtures manually.
const restoreTemplate = () => {
  if (restored || !backupDir) return
  for (const swappedPath of SWAPPED_PATHS) {
    rmSync(join(TEMPLATE_DIR, swappedPath), { recursive: true, force: true })
    cpSync(join(backupDir, swappedPath), join(TEMPLATE_DIR, swappedPath), {
      recursive: true,
    })
  }
  rmSync(join(TEMPLATE_DIR, "public", "sitemap.json"), { force: true })
  rmSync(OUT_DIR, { recursive: true, force: true })
  // build:template codegen — remove so a failed/killed run does not leave
  // fixture-specific heavy routes in the working tree
  rmSync(HEAVY_ROUTES_DIR, { recursive: true, force: true })
  rmSync(HEAVY_ROUTES_MANIFEST, { force: true })
  restored = true
}

beforeAll(async () => {
  // Arrange: the same rich site the publishing suite asserts on
  const { siteId } = await seedPublishingSite()

  outputDir = mkdtempSync(join(tmpdir(), "publishing-full-build-"))
  const publishResult = spawnSync(TSX_BIN, ["index.ts"], {
    cwd: PACKAGE_DIR,
    encoding: "utf-8",
    timeout: 120_000,
    env: {
      ...process.env,
      // dd-trace (loaded via NODE_OPTIONS in CI) breaks spawned subprocesses
      NODE_OPTIONS: "",
      SITE_ID: String(siteId),
      ...TEST_DB_ENV,
      OUTPUT_DIR: outputDir,
    },
  })
  if (publishResult.error || publishResult.status !== 0) {
    throw new Error(
      `publishing script exited with ${publishResult.status} (${publishResult.error}):\n${publishResult.stdout}\n${publishResult.stderr}`,
    )
  }

  try {
    // Act: replay publisher.sh's pre-build steps, then build the template
    //
    // Phase 1: complete all backups before touching the template. backupDir is
    // only assigned once all copies succeed so restoreTemplate is never called
    // with a partial backup (which would crash on a missing path).
    const tmpBackupDir = mkdtempSync(join(tmpdir(), "template-fixtures-"))
    for (const swappedPath of SWAPPED_PATHS) {
      cpSync(join(TEMPLATE_DIR, swappedPath), join(tmpBackupDir, swappedPath), {
        recursive: true,
      })
    }
    backupDir = tmpBackupDir
    // Phase 2: replace template fixtures with publishing script output
    for (const swappedPath of SWAPPED_PATHS) {
      rmSync(join(TEMPLATE_DIR, swappedPath), { recursive: true, force: true })
      cpSync(join(outputDir, swappedPath), join(TEMPLATE_DIR, swappedPath), {
        recursive: true,
      })
    }
    cpSync(
      join(outputDir, "sitemap.json"),
      join(TEMPLATE_DIR, "public", "sitemap.json"),
    )
    const indexJsonPath = join(TEMPLATE_DIR, "schema", "_index.json")
    if (!existsSync(indexJsonPath)) {
      throw new Error(
        "Publishing script did not produce schema/_index.json; check the root page seed",
      )
    }
    cpSync(indexJsonPath, join(TEMPLATE_DIR, "schema", "not-found.json"))
    rmSync(OUT_DIR, { recursive: true, force: true })

    // Match publisher.sh / build.sh: generate layout routes, then next
    // build. Collection/search/database landings are excluded from the
    // catch-all and only emit HTML via codegen'd app/(heavy) pages.
    //
    // Spawned (not execFile) so the child can inherit a clean
    // NODE_OPTIONS — CI injects dd-trace via --require/--import, and
    // that instrumentation crashes next's build worker under Node 22 +
    // Next 15.5.
    const buildResult = spawnSync("pnpm", ["run", "build:template"], {
      cwd: TEMPLATE_DIR,
      encoding: "utf-8",
      timeout: 600_000,
      env: {
        ...process.env,
        NODE_OPTIONS: "",
      },
    })
    if (buildResult.error || buildResult.status !== 0) {
      throw new Error(
        `template build exited with ${buildResult.status} (${buildResult.error}):\n${buildResult.stdout}\n${buildResult.stderr}`,
      )
    }
  } catch (error) {
    restoreTemplate()
    throw error
  }
})

afterAll(async () => {
  restoreTemplate()
  await db.destroy()
  if (outputDir) {
    rmSync(outputDir, { recursive: true, force: true })
  }
  if (backupDir) {
    rmSync(backupDir, { recursive: true, force: true })
  }
})

describe("full template build", () => {
  it("renders every published page to static HTML", () => {
    // Arrange / Act / Assert
    const expectedPages = [
      "index.html",
      join("about", "index.html"),
      join("about", "our-team", "index.html"),
      join("dangling", "index.html"),
      join("dangling", "lonely-page", "index.html"),
      join("news", "index.html"),
      join("news", "zebra-article", "index.html"),
    ]
    for (const page of expectedPages) {
      expect(existsSync(join(OUT_DIR, page)), page).toBe(true)
    }
  })

  it("does not render pages for collection links or drafts", () => {
    // Arrange / Act / Assert
    expect(existsSync(join(OUT_DIR, "news", "alpha-link"))).toBe(false)
    expect(existsSync(join(OUT_DIR, "news", "alpha-link.html"))).toBe(false)
    expect(existsSync(join(OUT_DIR, "draft-page"))).toBe(false)
  })

  it("renders the seeded site name into the homepage", () => {
    // Arrange / Act
    const homepage = readFileSync(join(OUT_DIR, "index.html"), "utf-8")

    // Assert
    expect(homepage).toContain("E2E Test Site")
  })

  it("emits the 404 page and crawler files", () => {
    // Arrange / Act / Assert
    expect(existsSync(join(OUT_DIR, "404.html"))).toBe(true)
    expect(existsSync(join(OUT_DIR, "sitemap.xml"))).toBe(true)
    expect(existsSync(join(OUT_DIR, "robots.txt"))).toBe(true)
  })
})
