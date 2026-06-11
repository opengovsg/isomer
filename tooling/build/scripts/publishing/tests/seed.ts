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
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
}

const USER_ID = "publishing-e2e-user"

export const NAVBAR_CONTENT = {
  items: [{ name: "Who we are", url: "/about" }],
}
export const FOOTER_CONTENT = {
  siteNavItems: [{ title: "Who we are", url: "/about" }],
  contactUsLink: "/contact",
}
export const SITE_CONFIG = {
  siteName: "E2E Test Site",
  url: "https://e2e.example.com",
  isGovernment: true,
}
// The site-theme Tailwind preset reads colors.brand.{canvas,interaction} at
// template build time, so the seeded theme must be structurally valid
export const SITE_THEME = {
  colors: {
    brand: {
      canvas: {
        default: "#e6ecef",
        alt: "#bfcfd7",
        backdrop: "#80a0af",
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

// One rich site covering every code path the publishing script handles:
// homepage, FolderMeta ordering, folder with its own index page, dangling
// folder and collection (auto-generated index pages), drafts, redirects,
// and a second site to verify site scoping
export const seedPublishingSite = async () => {
  await db
    .insertInto("User")
    .values({
      id: USER_ID,
      name: "Publishing E2E",
      email: "publishing-e2e@example.com",
      phone: "",
    })
    .execute()

  const siteId = await seedSite({
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
  const aboutFolderId = await seedFolder({
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
  const danglingFolderId = await seedFolder({
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
  const newsCollectionId = await seedFolder({
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

  return { siteId, aboutFolderId, danglingFolderId, newsCollectionId }
}
