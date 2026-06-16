import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { createDb, ResourceState, ResourceType } from "@isomer/db"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_DIR = join(__dirname, "..")
const TSX_BIN = join(PACKAGE_DIR, "node_modules", ".bin", "tsx")

const DB_HOST = process.env.TEST_DB_HOST ?? ""
const DB_PORT = process.env.TEST_DB_PORT ?? ""
const DB_USERNAME = process.env.TEST_DB_USERNAME ?? ""
const DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? ""
const DB_NAME = process.env.TEST_DB_NAME ?? ""

const db = createDb({
  connectionString: `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
})

const USER_ID = "publishing-e2e-user"

const NAVBAR_CONTENT = {
  items: [{ name: "Who we are", url: "/about" }],
}
const FOOTER_CONTENT = {
  siteNavItems: [{ title: "Who we are", url: "/about" }],
  contactUsLink: "/contact",
}
const SITE_CONFIG = {
  siteName: "E2E Test Site",
  url: "https://e2e.example.com",
  isGovernment: true,
}
const SITE_THEME = {
  colors: { brand: "#4d2dc4" },
}

const seedSite = async ({
  name,
  config = {},
  theme = null,
}: {
  name: string
  config?: object
  theme?: object | null
}) => {
  const site = await db
    .insertInto("Site")
    .values({ name, config, theme })
    .returning("id")
    .executeTakeFirstOrThrow()
  return site.id
}

const seedFolder = async ({
  siteId,
  type,
  title,
  permalink,
  parentId = null,
}: {
  siteId: number
  type: typeof ResourceType.Folder | typeof ResourceType.Collection
  title: string
  permalink: string
  parentId?: string | null
}) => {
  const folder = await db
    .insertInto("Resource")
    .values({
      siteId,
      type,
      title,
      permalink,
      parentId,
      state: ResourceState.Published,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  return folder.id
}

const seedPage = async ({
  siteId,
  type,
  title,
  permalink,
  parentId = null,
  content,
  publish = true,
}: {
  siteId: number
  type: ResourceType
  title: string
  permalink: string
  parentId?: string | null
  content: object
  publish?: boolean
}) => {
  const blob = await db
    .insertInto("Blob")
    .values({ content })
    .returning("id")
    .executeTakeFirstOrThrow()

  const page = await db
    .insertInto("Resource")
    .values({
      siteId,
      type,
      title,
      permalink,
      parentId,
      ...(publish
        ? { state: ResourceState.Published }
        : { state: ResourceState.Draft, draftBlobId: blob.id }),
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  if (publish) {
    const version = await db
      .insertInto("Version")
      .values({
        versionNum: 1,
        resourceId: page.id,
        blobId: blob.id,
        publishedBy: USER_ID,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    await db
      .updateTable("Resource")
      .set({ publishedVersionId: version.id })
      .where("id", "=", page.id)
      .execute()
  }

  return page.id
}

const seedRedirect = async ({
  siteId,
  source,
  destination,
  deletedAt = null,
}: {
  siteId: number
  source: string
  destination: string
  deletedAt?: Date | null
}) => {
  await db
    .insertInto("Redirect")
    .values({ siteId, source, destination, deletedAt })
    .execute()
}

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
  await db
    .insertInto("User")
    .values({
      id: USER_ID,
      name: "Publishing E2E",
      email: "publishing-e2e@example.com",
      phone: "",
    })
    .execute()

  siteId = await seedSite({
    name: "E2E Test Site",
    config: SITE_CONFIG,
    theme: SITE_THEME,
  })
  await db
    .insertInto("Navbar")
    .values({ siteId, content: NAVBAR_CONTENT })
    .execute()
  await db
    .insertInto("Footer")
    .values({ siteId, content: FOOTER_CONTENT })
    .execute()

  await seedPage({
    siteId,
    type: ResourceType.RootPage,
    title: "Home",
    permalink: "",
    content: {
      version: "0.1.0",
      layout: "homepage",
      page: { description: "The official E2E test site" },
      content: [],
    },
  })

  // Orders the root-level children; "_meta" must also be stripped from permalinks
  await seedPage({
    siteId,
    type: ResourceType.FolderMeta,
    title: "Root meta",
    permalink: "_meta",
    content: { order: ["news", "about", "dangling"] },
  })

  // A folder with its own index page and a child page
  aboutFolderId = await seedFolder({
    siteId,
    type: ResourceType.Folder,
    title: "Who we are",
    permalink: "about",
  })
  await seedPage({
    siteId,
    type: ResourceType.IndexPage,
    title: "Who we are",
    permalink: "_index",
    parentId: aboutFolderId,
    content: {
      version: "0.1.0",
      layout: "index",
      page: { contentPageHeader: { summary: "All about us" } },
      content: [],
    },
  })
  await seedPage({
    siteId,
    type: ResourceType.Page,
    title: "Our team",
    permalink: "our-team",
    parentId: aboutFolderId,
    content: {
      version: "0.1.0",
      layout: "content",
      page: { contentPageHeader: { summary: ["Meet", "the team"] } },
      content: [{ type: "image", src: "/images/team.png", alt: "The team" }],
    },
  })

  // A folder WITHOUT an index page: the script must auto-generate one
  danglingFolderId = await seedFolder({
    siteId,
    type: ResourceType.Folder,
    title: "All the danglers",
    permalink: "dangling",
  })
  await seedPage({
    siteId,
    type: ResourceType.Page,
    title: "Lonely page",
    permalink: "lonely-page",
    parentId: danglingFolderId,
    content: {
      version: "0.1.0",
      layout: "content",
      page: { contentPageHeader: { summary: "A lonely page" } },
      content: [],
    },
  })

  // A collection (also without an index page) with a page and a link
  newsCollectionId = await seedFolder({
    siteId,
    type: ResourceType.Collection,
    title: "News",
    permalink: "news",
  })
  await seedPage({
    siteId,
    type: ResourceType.CollectionPage,
    title: "Zebra article",
    permalink: "zebra-article",
    parentId: newsCollectionId,
    content: {
      version: "0.1.0",
      layout: "article",
      page: {
        date: "15/01/2026",
        category: "Press releases",
        articlePageHeader: { summary: "Zebra article summary" },
        image: { src: "/images/zebra.png", alt: "A zebra" },
      },
      content: [],
    },
  })
  await seedPage({
    siteId,
    type: ResourceType.CollectionLink,
    title: "Alpha link",
    permalink: "alpha-link",
    parentId: newsCollectionId,
    content: {
      version: "0.1.0",
      layout: "link",
      page: {
        ref: "https://example.com",
        date: "01/01/2026",
        category: "Press releases",
        description: "An external link",
      },
      content: [],
    },
  })

  // A draft-only page: must NOT be published
  await seedPage({
    siteId,
    type: ResourceType.Page,
    title: "Secret draft",
    permalink: "draft-page",
    content: {
      version: "0.1.0",
      layout: "content",
      page: { contentPageHeader: { summary: "Not ready yet" } },
      content: [],
    },
    publish: false,
  })

  await seedRedirect({ siteId, source: "/old-about", destination: "/about" })
  await seedRedirect({ siteId, source: "/old-news", destination: "/news" })
  await seedRedirect({
    siteId,
    source: "/deleted",
    destination: "/gone",
    deletedAt: new Date(),
  })

  // A second site: nothing from it may leak into the output
  const otherSiteId = await seedSite({ name: "Other site" })
  await seedPage({
    siteId: otherSiteId,
    type: ResourceType.RootPage,
    title: "Other home",
    permalink: "",
    content: {
      version: "0.1.0",
      layout: "homepage",
      page: { description: "Other site" },
      content: [],
    },
  })
  await seedPage({
    siteId: otherSiteId,
    type: ResourceType.Page,
    title: "Other page",
    permalink: "other-page",
    content: {
      version: "0.1.0",
      layout: "content",
      page: { contentPageHeader: { summary: "Other site page" } },
      content: [],
    },
  })
  await seedRedirect({
    siteId: otherSiteId,
    source: "/other-old",
    destination: "/other-new",
  })

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
      DB_HOST,
      DB_PORT,
      DB_USERNAME,
      DB_PASSWORD,
      DB_NAME,
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
