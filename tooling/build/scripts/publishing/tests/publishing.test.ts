import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { ResourceType } from "@isomer/db"

import {
  db,
  FOOTER_CONTENT,
  NAVBAR_CONTENT,
  seedPublishingSite,
  SITE_CONFIG,
  SITE_THEME,
  TEST_DB_ENV,
} from "./seed"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_DIR = join(__dirname, "..")
const TSX_BIN = join(PACKAGE_DIR, "node_modules", ".bin", "tsx")

interface SitemapEntry {
  id: string
  type: string
  title: string
  permalink: string
  lastModified: string
  layout: string
  summary: string
  category?: string
  date?: string
  image?: { src?: string; alt?: string }
  firstImage?: { src?: string; alt?: string }
  ref?: string
  children?: SitemapEntry[]
}

const collectPermalinks = (entry: SitemapEntry): string[] => [
  entry.permalink,
  ...(entry.children ?? []).flatMap(collectPermalinks),
]

let outputDir: string
let siteId: number
let aboutFolderId: string
let danglingFolderId: string
let newsCollectionId: string

const readOutput = (...segments: string[]) =>
  JSON.parse(readFileSync(join(outputDir, ...segments), "utf-8"))

const readSitemap = () => readOutput("sitemap.json") as SitemapEntry

beforeAll(async () => {
  // Arrange: one rich site covering every code path the script handles
  ;({ siteId, aboutFolderId, danglingFolderId, newsCollectionId } =
    await seedPublishingSite())

  // Act: run the script exactly as CodeBuild does, via the tsx entrypoint
  outputDir = mkdtempSync(join(tmpdir(), "publishing-e2e-"))
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
    rmSync(outputDir, { recursive: true, force: true })
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
      type: ResourceType.IndexPage,
      title: "Who we are",
      layout: "index",
      summary: "All about us",
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
      type: ResourceType.Page,
      title: "Our team",
      permalink: "/about/our-team",
      layout: "content",
      // Array summaries are joined with spaces
      summary: "Meet the team",
      // The first image component in the page content is surfaced
      firstImage: { src: "/images/team.png", alt: "The team" },
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
      type: ResourceType.Folder,
      title: "All the danglers",
      layout: "index",
      summary: "Pages in All the danglers",
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
      type: ResourceType.Collection,
      title: "News",
      layout: "collection",
    })
    // No order is configured for the collection, so children sort by title
    expect(news?.children?.map((child) => child.permalink)).toEqual([
      "/news/alpha-link",
      "/news/zebra-article",
    ])
    expect(news?.children?.[0]).toMatchObject({
      type: ResourceType.CollectionLink,
      layout: "link",
      ref: "https://example.com",
      date: "01/01/2026",
      category: "Press releases",
      summary: "An external link",
    })
    expect(news?.children?.[1]).toMatchObject({
      type: ResourceType.CollectionPage,
      layout: "article",
      date: "15/01/2026",
      category: "Press releases",
      summary: "Zebra article summary",
      image: { src: "/images/zebra.png", alt: "A zebra" },
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
    expect(existsSync(join(outputDir, "schema", "_index.json"))).toBe(true)
    expect(existsSync(join(outputDir, "schema", "about", "_index.json"))).toBe(
      true,
    )
    expect(
      existsSync(join(outputDir, "schema", "about", "our-team.json")),
    ).toBe(true)
    expect(
      existsSync(join(outputDir, "schema", "dangling", "lonely-page.json")),
    ).toBe(true)
    expect(
      existsSync(join(outputDir, "schema", "news", "zebra-article.json")),
    ).toBe(true)
    expect(
      existsSync(join(outputDir, "schema", "news", "alpha-link.json")),
    ).toBe(true)
  })

  it("does not write files for drafts, meta resources or other sites", () => {
    // Arrange / Act / Assert
    expect(existsSync(join(outputDir, "schema", "draft-page.json"))).toBe(false)
    expect(existsSync(join(outputDir, "schema", "_meta.json"))).toBe(false)
    expect(existsSync(join(outputDir, "schema", "other-page.json"))).toBe(false)
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
      version: "0.1.0",
      layout: "index",
      page: {
        title: "All the danglers",
        contentPageHeader: { summary: "Pages in All the danglers" },
      },
      content: [],
    })
  })

  it("auto-generates a collection index page file for a dangling collection", () => {
    // Arrange / Act
    const collectionIndex = readOutput("schema", "news", "_index.json")

    // Assert
    expect(collectionIndex).toEqual({
      version: "0.1.0",
      layout: "collection",
      page: {
        title: "News",
        contentPageHeader: { summary: "Pages in News" },
        variant: "collection",
      },
      content: [],
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
    const redirects = readOutput("redirects.json")

    // Assert
    expect(redirects).toHaveLength(2)
    expect(redirects).toEqual(
      expect.arrayContaining([
        { source: "/old-about", destination: "/about" },
        { source: "/old-news", destination: "/news" },
      ]),
    )
  })
})
