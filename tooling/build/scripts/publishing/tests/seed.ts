import { createDb, ResourceState, ResourceType } from "@isomer/db"

const DB_HOST = process.env.TEST_DB_HOST ?? ""
const DB_PORT = process.env.TEST_DB_PORT ?? ""
const DB_USERNAME = process.env.TEST_DB_USERNAME ?? ""
const DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? ""
const DB_NAME = process.env.TEST_DB_NAME ?? ""

export const db = createDb({
  connectionString: `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
})

// Connection env vars for spawning the publishing script as a subprocess
export const TEST_DB_ENV = {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
}

const USER_ID = "publishing-e2e-user"

export const NAVBAR_CONTENT = {
  items: [{ name: "Who we are", url: "/about" }],
}
export const FOOTER_CONTENT = {
  contactUsLink: "/contact",
  siteNavItems: [{ title: "Who we are", url: "/about" }],
}
export const SITE_CONFIG = {
  isGovernment: true,
  siteName: "E2E Test Site",
  url: "https://e2e.example.com",
}
// The site-theme Tailwind preset reads colors.brand.{canvas,interaction} at
// template build time, so the seeded theme must be structurally valid
export const SITE_THEME = {
  colors: {
    brand: {
      canvas: {
        alt: "#bfcfd7",
        backdrop: "#80a0af",
        default: "#e6ecef",
        inverse: "#00405f",
      },
      interaction: {
        default: "#00405f",
        hover: "#002e44",
        pressed: "#00283b",
      },
    },
  },
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
    .values({ config, name, theme })
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
      parentId,
      permalink,
      siteId,
      state: ResourceState.Published,
      title,
      type,
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
      parentId,
      permalink,
      siteId,
      title,
      type,
      ...(publish
        ? { state: ResourceState.Published }
        : { draftBlobId: blob.id, state: ResourceState.Draft }),
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  if (publish) {
    const version = await db
      .insertInto("Version")
      .values({
        blobId: blob.id,
        publishedBy: USER_ID,
        resourceId: page.id,
        versionNum: 1,
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
    .values({ deletedAt, destination, siteId, source })
    .execute()
}

// One rich site covering every code path the publishing script handles:
// homepage, FolderMeta ordering, folder with its own index page, dangling
// folder and collection (auto-generated index pages), drafts, redirects,
// and a second site to verify site scoping
export const seedPublishingSite = async () => {
  await db
    .insertInto("User")
    .values({
      email: "publishing-e2e@example.com",
      id: USER_ID,
      name: "Publishing E2E",
      phone: "",
    })
    .execute()

  const siteId = await seedSite({
    config: SITE_CONFIG,
    name: "E2E Test Site",
    theme: SITE_THEME,
  })
  await db
    .insertInto("Navbar")
    .values({ content: NAVBAR_CONTENT, siteId })
    .execute()
  await db
    .insertInto("Footer")
    .values({ content: FOOTER_CONTENT, siteId })
    .execute()

  const rootPageId = await seedPage({
    content: {
      content: [],
      layout: "homepage",
      page: { description: "The official E2E test site" },
      version: "0.1.0",
    },
    permalink: "",
    siteId,
    title: "Home",
    type: ResourceType.RootPage,
  })

  // Orders the root-level children; "_meta" must also be stripped from permalinks
  await seedPage({
    content: { order: ["news", "about", "dangling"] },
    permalink: "_meta",
    siteId,
    title: "Root meta",
    type: ResourceType.FolderMeta,
  })

  // A folder with its own index page and a child page
  const aboutFolderId = await seedFolder({
    permalink: "about",
    siteId,
    title: "Who we are",
    type: ResourceType.Folder,
  })
  const aboutIndexPageId = await seedPage({
    content: {
      content: [],
      layout: "index",
      page: { contentPageHeader: { summary: "All about us" } },
      version: "0.1.0",
    },
    parentId: aboutFolderId,
    permalink: "_index",
    siteId,
    title: "Who we are",
    type: ResourceType.IndexPage,
  })
  const ourTeamPageId = await seedPage({
    content: {
      content: [{ alt: "The team", src: "/images/team.png", type: "image" }],
      layout: "content",
      page: { contentPageHeader: { summary: ["Meet", "the team"] } },
      version: "0.1.0",
    },
    parentId: aboutFolderId,
    permalink: "our-team",
    siteId,
    title: "Our team",
    type: ResourceType.Page,
  })

  // A folder WITHOUT an index page: the script must auto-generate one
  const danglingFolderId = await seedFolder({
    permalink: "dangling",
    siteId,
    title: "All the danglers",
    type: ResourceType.Folder,
  })
  await seedPage({
    content: {
      content: [],
      layout: "content",
      page: { contentPageHeader: { summary: "A lonely page" } },
      version: "0.1.0",
    },
    parentId: danglingFolderId,
    permalink: "lonely-page",
    siteId,
    title: "Lonely page",
    type: ResourceType.Page,
  })

  // A collection (also without an index page) with a page and a link
  const newsCollectionId = await seedFolder({
    permalink: "news",
    siteId,
    title: "News",
    type: ResourceType.Collection,
  })
  await seedPage({
    content: {
      content: [],
      layout: "article",
      page: {
        articlePageHeader: { summary: "Zebra article summary" },
        category: "Press releases",
        date: "15/01/2026",
        image: { alt: "A zebra", src: "/images/zebra.png" },
      },
      version: "0.1.0",
    },
    parentId: newsCollectionId,
    permalink: "zebra-article",
    siteId,
    title: "Zebra article",
    type: ResourceType.CollectionPage,
  })
  await seedPage({
    content: {
      content: [],
      layout: "link",
      page: {
        category: "Press releases",
        date: "01/01/2026",
        description: "An external link",
        ref: "https://example.com",
      },
      version: "0.1.0",
    },
    parentId: newsCollectionId,
    permalink: "alpha-link",
    siteId,
    title: "Alpha link",
    type: ResourceType.CollectionLink,
  })

  // A draft-only page: must NOT be published
  const draftPageId = await seedPage({
    content: {
      content: [],
      layout: "content",
      page: { contentPageHeader: { summary: "Not ready yet" } },
      version: "0.1.0",
    },
    permalink: "draft-page",
    publish: false,
    siteId,
    title: "Secret draft",
    type: ResourceType.Page,
  })

  await seedRedirect({ destination: "/about", siteId, source: "/old-about" })
  await seedRedirect({ destination: "/news", siteId, source: "/old-news" })
  await seedRedirect({
    deletedAt: new Date(),
    destination: "/gone",
    siteId,
    source: "/deleted",
  })
  // Reference destinations: resolved to the page's current permalink at publish
  await seedRedirect({
    destination: `[resource:${siteId}:${ourTeamPageId}]`,
    siteId,
    source: "/ref-page",
  })
  // Reproduces ISOM-2525: a redirect created before a folder rename now
  // resolves to the exact same live URL as its source and must not be emitted.
  await seedRedirect({
    destination: `[resource:${siteId}:${ourTeamPageId}]`,
    siteId,
    source: "/about/our-team",
  })
  // Folder variant of the same failure: the wildcard resolver appends the
  // matched remainder, so /about/* -> /about sends every request back to the
  // exact path it started from.
  await seedRedirect({
    destination: `[resource:${siteId}:${aboutFolderId}]`,
    siteId,
    source: "/about/*",
  })
  // A reference to an index page resolves to its folder (the "_index" segment
  // is stripped, matching what the editor displays)
  await seedRedirect({
    destination: `[resource:${siteId}:${aboutIndexPageId}]`,
    siteId,
    source: "/ref-index",
  })
  // A reference to the folder itself resolves via its published index page to
  // the folder's URL
  await seedRedirect({
    destination: `[resource:${siteId}:${aboutFolderId}]`,
    siteId,
    source: "/ref-folder",
  })
  // A reference to a folder with no published index page is dropped
  await seedRedirect({
    destination: `[resource:${siteId}:${danglingFolderId}]`,
    siteId,
    source: "/ref-dangling-folder",
  })
  // A reference to the root page resolves to "/"
  await seedRedirect({
    destination: `[resource:${siteId}:${rootPageId}]`,
    siteId,
    source: "/ref-root",
  })
  // A reference to an unpublished page is dropped
  await seedRedirect({
    destination: `[resource:${siteId}:${draftPageId}]`,
    siteId,
    source: "/ref-draft",
  })
  // A reference whose embedded siteId is not this site is dropped
  await seedRedirect({
    destination: `[resource:${siteId + 999}:${ourTeamPageId}]`,
    siteId,
    source: "/ref-wrong-site",
  })

  // A second site: nothing from it may leak into the output
  const otherSiteId = await seedSite({ name: "Other site" })
  await seedPage({
    content: {
      content: [],
      layout: "homepage",
      page: { description: "Other site" },
      version: "0.1.0",
    },
    permalink: "",
    siteId: otherSiteId,
    title: "Other home",
    type: ResourceType.RootPage,
  })
  await seedPage({
    content: {
      content: [],
      layout: "content",
      page: { contentPageHeader: { summary: "Other site page" } },
      version: "0.1.0",
    },
    permalink: "other-page",
    siteId: otherSiteId,
    title: "Other page",
    type: ResourceType.Page,
  })
  await seedRedirect({
    destination: "/other-new",
    siteId: otherSiteId,
    source: "/other-old",
  })

  return {
    aboutFolderId,
    aboutIndexPageId,
    danglingFolderId,
    draftPageId,
    newsCollectionId,
    ourTeamPageId,
    rootPageId,
    siteId,
  }
}
