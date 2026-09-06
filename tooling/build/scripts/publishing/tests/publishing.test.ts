import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { ResourceType } from "@isomer/db"

import type { TestSitemapEntry } from "../schemas"
import { redirectsFileSchema, testSitemapEntrySchema } from "../schemas"
import {
  db,
  FOOTER_CONTENT,
  NAVBAR_CONTENT,
  seedPublishingSite,
  SITE_CONFIG,
  SITE_THEME,
  TEST_DB_ENV,
} from "./seed"

const PACKAGE_DIR = path.join(import.meta.dirname, "..")
const TSX_BIN = path.join(PACKAGE_DIR, "node_modules", ".bin", "tsx")

const collectPermalinks = (entry: TestSitemapEntry): string[] => [
  entry.permalink,
  ...(entry.children ?? []).flatMap(collectPermalinks),
]

let outputDir: string
let siteId: number
let aboutFolderId: string
let danglingFolderId: string
let newsCollectionId: string

const readOutput = (...segments: string[]) =>
  JSON.parse(readFileSync(path.join(outputDir, ...segments), "utf-8"))

interface RedirectRow {
  source: string
  destination: string
}

const readRedirects = (...segments: string[]): RedirectRow[] =>
  redirectsFileSchema.parse(readOutput(...segments))

const readSitemap = (): TestSitemapEntry =>
  testSitemapEntrySchema.parse(readOutput("sitemap.json"))

beforeAll(async () => {
  // Arrange: one rich site covering every code path the script handles
  ;({ siteId, aboutFolderId, danglingFolderId, newsCollectionId } =
    await seedPublishingSite())

  // Act: run the script exactly as CodeBuild does, via the tsx entrypoint
  outputDir = mkdtempSync(path.join(tmpdir(), "publishing-e2e-"))
  const result = spawnSync(TSX_BIN, ["index.ts"], {
    cwd: PACKAGE_DIR,
    encoding: "utf-8",
    env: {
      ...process.env,
      // dd-trace (loaded via NODE_OPTIONS in CI) breaks spawned subprocesses
      NODE_OPTIONS: "",
      SITE_ID: String(siteId),
      ...TEST_DB_ENV,
      OUTPUT_DIR: outputDir,
    },
  })

  if (result.status !== 0) {
    throw new Error(
      `publishing script exited with ${result.status}:\n${result.stdout}\n${result.stderr}`,
    )
  }
})

afterAll(async () => {
  await db.destroy()
  if (outputDir) {
    rmSync(outputDir, { force: true, recursive: true })
  }
})

describe("sitemap.json", () => {
  it("uses the root page as the root entry", () => {
    // Arrange / Act
    const sitemap = readSitemap()

    // Assert
    expect(sitemap.type).toBe(ResourceType.RootPage)
    expect(sitemap.title).toBe("Home")
    expect(sitemap.permalink).toBe("/")
    expect(sitemap.layout).toBe("homepage")
    expect(sitemap.summary).toBe("The official E2E test site")
    // lastModified must be a valid ISO timestamp from the resource row
    expect(new Date(sitemap.lastModified).toISOString()).toBe(
      sitemap.lastModified,
    )
  })

  it("orders the root-level children by the FolderMeta order", () => {
    // Arrange / Act
    const sitemap = readSitemap()

    // Assert
    expect(sitemap.children?.map((child) => child.permalink)).toEqual([
      "/news",
      "/about",
      "/dangling",
    ])
  })

  it("strips _index from the folder index page and remaps its id to the folder", () => {
    // Arrange / Act
    const about = readSitemap().children?.find(
      (child) => child.permalink === "/about",
    )

    // Assert
    expect(about).toMatchObject({
      id: aboutFolderId,
      layout: "index",
      summary: "All about us",
      title: "Who we are",
      type: ResourceType.IndexPage,
    })
  })

  it("nests pages under their parent folder with full permalinks", () => {
    // Arrange / Act
    const about = readSitemap().children?.find(
      (child) => child.permalink === "/about",
    )

    // Assert
    expect(about?.children).toHaveLength(1)
    expect(about?.children?.[0]).toMatchObject({
      firstImage: { alt: "The team", src: "/images/team.png" },
      layout: "content",
      permalink: "/about/our-team",
      summary: "Meet the team",
      title: "Our team",
      type: ResourceType.Page,
    })
  })

  it("creates an auto-index entry for a folder without an index page", () => {
    // Arrange / Act
    const dangling = readSitemap().children?.find(
      (child) => child.permalink === "/dangling",
    )

    // Assert
    expect(dangling).toMatchObject({
      id: danglingFolderId,
      layout: "index",
      summary: "Pages in All the danglers",
      title: "All the danglers",
      type: ResourceType.Folder,
    })
    expect(dangling?.children?.map((child) => child.permalink)).toEqual([
      "/dangling/lonely-page",
    ])
  })

  it("creates an auto-index entry for a collection and sorts its children by title", () => {
    // Arrange / Act
    const news = readSitemap().children?.find(
      (child) => child.permalink === "/news",
    )

    // Assert
    expect(news).toMatchObject({
      id: newsCollectionId,
      layout: "collection",
      title: "News",
      type: ResourceType.Collection,
    })
    // No order is configured for the collection, so children sort by title
    expect(news?.children?.map((child) => child.permalink)).toEqual([
      "/news/alpha-link",
      "/news/zebra-article",
    ])
    expect(news?.children?.[0]).toMatchObject({
      category: "Press releases",
      date: "01/01/2026",
      layout: "link",
      ref: "https://example.com",
      summary: "An external link",
      type: ResourceType.CollectionLink,
    })
    expect(news?.children?.[1]).toMatchObject({
      category: "Press releases",
      date: "15/01/2026",
      image: { alt: "A zebra", src: "/images/zebra.png" },
      layout: "article",
      summary: "Zebra article summary",
      type: ResourceType.CollectionPage,
    })
  })

  it("excludes draft-only pages", () => {
    // Arrange / Act
    const permalinks = collectPermalinks(readSitemap())

    // Assert
    expect(permalinks).not.toContain("/draft-page")
  })

  it("excludes resources belonging to other sites", () => {
    // Arrange / Act
    const permalinks = collectPermalinks(readSitemap())

    // Assert
    expect(permalinks).not.toContain("/other-page")
  })
})

describe("schema files", () => {
  it("writes one file per published page", () => {
    // Arrange / Act / Assert
    expect(existsSync(path.join(outputDir, "schema", "_index.json"))).toBe(true)
    expect(
      existsSync(path.join(outputDir, "schema", "about", "_index.json")),
    ).toBe(true)
    expect(
      existsSync(path.join(outputDir, "schema", "about", "our-team.json")),
    ).toBe(true)
    expect(
      existsSync(
        path.join(outputDir, "schema", "dangling", "lonely-page.json"),
      ),
    ).toBe(true)
    expect(
      existsSync(path.join(outputDir, "schema", "news", "zebra-article.json")),
    ).toBe(true)
    expect(
      existsSync(path.join(outputDir, "schema", "news", "alpha-link.json")),
    ).toBe(true)
  })

  it("does not write files for drafts, meta resources or other sites", () => {
    // Arrange / Act / Assert
    expect(existsSync(path.join(outputDir, "schema", "draft-page.json"))).toBe(
      false,
    )
    expect(existsSync(path.join(outputDir, "schema", "_meta.json"))).toBe(false)
    expect(existsSync(path.join(outputDir, "schema", "other-page.json"))).toBe(
      false,
    )
  })

  it("injects the resource title into the written page content", () => {
    // Arrange / Act
    const homepage = readOutput("schema", "_index.json")

    // Assert
    expect(homepage.layout).toBe("homepage")
    expect(homepage.page.title).toBe("Home")
    expect(homepage.page.description).toBe("The official E2E test site")
  })

  it("auto-generates an index page file for a dangling folder", () => {
    // Arrange / Act
    const folderIndex = readOutput("schema", "dangling", "_index.json")

    // Assert
    expect(folderIndex).toEqual({
      content: [],
      layout: "index",
      page: {
        contentPageHeader: { summary: "Pages in All the danglers" },
        title: "All the danglers",
      },
      version: "0.1.0",
    })
  })

  it("auto-generates a collection index page file for a dangling collection", () => {
    // Arrange / Act
    const collectionIndex = readOutput("schema", "news", "_index.json")

    // Assert
    expect(collectionIndex).toEqual({
      content: [],
      layout: "collection",
      page: {
        contentPageHeader: { summary: "Pages in News" },
        title: "News",
        variant: "collection",
      },
      version: "0.1.0",
    })
  })
})

describe("site data files", () => {
  it("writes the navbar content", () => {
    // Arrange / Act / Assert
    expect(readOutput("data", "navbar.json")).toEqual(NAVBAR_CONTENT)
  })

  it("writes the footer content", () => {
    // Arrange / Act / Assert
    expect(readOutput("data", "footer.json")).toEqual(FOOTER_CONTENT)
  })

  it("merges the site config and theme into config.json", () => {
    // Arrange / Act / Assert
    expect(readOutput("data", "config.json")).toEqual({
      site: SITE_CONFIG,
      ...SITE_THEME,
    })
  })
})

describe("redirects.json", () => {
  it("writes only the live redirects of the site", () => {
    // Arrange / Act
    const redirects = readRedirects("redirects.json")

    // Assert: literal destinations pass through; references resolve to the
    // target's current permalink; the deleted, unpublished-reference, and
    // other-site redirects are all excluded
    expect(redirects).toEqual(
      expect.arrayContaining([
        { destination: "/about", source: "/old-about" },
        { destination: "/news", source: "/old-news" },
        { destination: "/about/our-team", source: "/ref-page" },
        { destination: "/about", source: "/ref-index" },
        { destination: "/about", source: "/ref-folder" },
        { destination: "/", source: "/ref-root" },
      ]),
    )
    expect(redirects).toHaveLength(6)
  })

  it("drops a redirect whose referenced page is unpublished", () => {
    // Arrange / Act
    const redirects = readRedirects("redirects.json")

    // Assert
    expect(
      redirects.find((redirect) => redirect.source === "/ref-draft"),
    ).toBeUndefined()
  })

  it("drops a folder reference with no published index page", () => {
    // Arrange / Act
    const redirects = readRedirects("redirects.json")

    // Assert
    expect(
      redirects.find((redirect) => redirect.source === "/ref-dangling-folder"),
    ).toBeUndefined()
  })

  it("drops a reference whose embedded siteId is not this site", () => {
    // Arrange / Act
    const redirects = readRedirects("redirects.json")

    // Assert
    expect(
      redirects.find((redirect) => redirect.source === "/ref-wrong-site"),
    ).toBeUndefined()
  })

  it("drops a redirect whose reference resolves back to its own source", () => {
    // Arrange / Act
    const redirects = readRedirects("redirects.json")

    // Assert — publishing this row would replace the live page object with a
    // redirect to the same URL, causing the loop reported in ISOM-2525.
    expect(
      redirects.find((redirect) => redirect.source === "/about/our-team"),
    ).toBeUndefined()
  })

  it("drops a wildcard whose folder reference resolves back to its own prefix", () => {
    // Arrange / Act
    const redirects = readRedirects("redirects.json")

    // Assert — this exercises GET_REDIRECTS' wildcard prefix branch. The edge
    // resolver would otherwise append each matched remainder to /about and
    // redirect every /about/... request back to itself.
    expect(
      redirects.find((redirect) => redirect.source === "/about/*"),
    ).toBeUndefined()
  })
})
