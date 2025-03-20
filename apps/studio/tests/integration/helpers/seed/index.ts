import {
  ResourceState,
  ResourceType,
  RoleType,
} from "~prisma/generated/generatedEnums"
import { db, jsonb } from "~server/db"
import { nanoid } from "nanoid"
import { MOCK_STORY_DATE } from "tests/msw/constants"

interface SetupPermissionsProps {
  userId?: string
  siteId: number
  isDeleted?: boolean
  role: (typeof RoleType)[keyof typeof RoleType]
  useCurrentTime?: boolean
}

const setupPermissions = async ({
  userId,
  siteId,
  role,
  isDeleted = false,
  useCurrentTime = false,
}: SetupPermissionsProps) => {
  if (!userId) throw new Error("userId is a required field")

  const time = useCurrentTime ? new Date() : MOCK_STORY_DATE
  return await db
    .insertInto("ResourcePermission")
    .values({
      userId: String(userId),
      siteId,
      role,
      resourceId: null,
      deletedAt: isDeleted ? time : null,
      createdAt: time,
      updatedAt: time,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const setupPublisherPermissions = async (
  props: Omit<SetupPermissionsProps, "role">,
) => {
  return await setupPermissions({ ...props, role: RoleType.Publisher })
}

export const setupEditorPermissions = async (
  props: Omit<SetupPermissionsProps, "role">,
) => {
  return await setupPermissions({ ...props, role: RoleType.Editor })
}

export const setupAdminPermissions = async (
  props: Omit<SetupPermissionsProps, "role">,
) => {
  return await setupPermissions({ ...props, role: RoleType.Admin })
}

export const setupSite = async (siteId?: number, fetch?: boolean) => {
  if (siteId !== undefined && fetch) {
    return db.transaction().execute(async (tx) => {
      const site = await tx
        .selectFrom("Site")
        .where("id", "=", siteId)
        .selectAll()
        .executeTakeFirstOrThrow()

      const navbar = await tx
        .selectFrom("Navbar")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const footer = await tx
        .selectFrom("Footer")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()

      return { site, navbar, footer }
    })
  }

  const name = `Ministry of Testing and Development ${nanoid()}`
  return await db.transaction().execute(async (tx) => {
    const site = await tx
      .insertInto("Site")
      .values({
        name,
        // @ts-expect-error not using the specific config for tests, no need to populate
        config: {
          theme: "isomer-next",
          logoUrl: "",
          siteName: name,
          isGovernment: true,
        },
        id: siteId,
        codeBuildId: null,
        theme: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Insert navbar
    const navbar = await tx
      .insertInto("Navbar")
      .values({
        content: jsonb([
          {
            url: "/item-one",
            name: "Expandable nav item",
            items: [
              {
                url: "/item-one/pa-network-one",
                name: "PA's network one",
                description:
                  "Click here and brace yourself for mild disappointment.",
              },
              {
                url: "/item-one/pa-network-two",
                name: "PA's network two",
                description:
                  "Click here and brace yourself for mild disappointment.",
              },
              { url: "/item-one/pa-network-three", name: "PA's network three" },
              {
                url: "/item-one/pa-network-four",
                name: "PA's network four",
                description:
                  "Click here and brace yourself for mild disappointment. This one has a pretty long one",
              },
              {
                url: "/item-one/pa-network-five",
                name: "PA's network five",
                description:
                  "Click here and brace yourself for mild disappointment. This one has a pretty long one",
              },
              {
                url: "/item-one/pa-network-six",
                name: "PA's network six",
                description:
                  "Click here and brace yourself for mild disappointment.",
              },
            ],
          },
        ]),
        siteId: site.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // // Insert footer
    const footer = await tx
      .insertInto("Footer")
      .values({
        content: jsonb({
          siteNavItems: [
            { url: "/about", title: "About us" },
            { url: "/partners", title: "Our partners" },
            { url: "/grants-and-programmes", title: "Grants and programmes" },
            { url: "/contact-us", title: "Contact us" },
            { url: "/something-else", title: "Something else" },
            { url: "/resources", title: "Resources" },
          ],
          contactUsLink: "/contact-us",
          termsOfUseLink: "/terms-of-use",
          feedbackFormLink: "https://www.form.gov.sg",
          privacyStatementLink: "/privacy",
        }),
        siteId: site.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return { site, navbar, footer }
  })
}

export const setupBlob = async (blobId?: string) => {
  if (blobId !== undefined) {
    return db
      .selectFrom("Blob")
      .where("id", "=", blobId)
      .selectAll()
      .executeTakeFirstOrThrow()
  }
  return db
    .insertInto("Blob")
    .values({
      content: jsonb({
        page: {
          contentPageHeader: { summary: "This is the page summary" },
        },
        layout: "content",
        content: [
          {
            type: "prose",
            content: [
              {
                type: "paragraph",
                content: [{ text: "Test block", type: "text" }],
              },
            ],
          },
          {
            type: "callout",
            content: {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  content: [{ text: "Test Callout content", type: "text" }],
                },
              ],
            },
          },
        ],
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

const getFallbackTitle = (resourceType: ResourceType) => {
  switch (resourceType) {
    case ResourceType.RootPage:
      return "Home"
    case ResourceType.CollectionPage:
      return "test collection page"
    case ResourceType.IndexPage:
      return "test index page"
    default:
      return "test page"
  }
}

const getFallbackPermalink = (resourceType: ResourceType) => {
  switch (resourceType) {
    case ResourceType.RootPage:
      return ""
    case ResourceType.CollectionPage:
      return "test-collection-page"
    case ResourceType.IndexPage:
      return "test-index-page"
    default:
      return "test-page"
  }
}

export const setupPageResource = async ({
  siteId: siteIdProp,
  blobId: blobIdProp,
  resourceType,
  state = ResourceState.Draft,
  userId,
  permalink,
  parentId,
  title,
}: {
  siteId?: number
  blobId?: string
  resourceType: ResourceType
  state?: ResourceState
  userId?: string
  permalink?: string
  parentId?: string | null
  title?: string
}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)
  const blob = await setupBlob(blobIdProp)

  let page = await db
    .insertInto("Resource")
    .values({
      title: title ?? getFallbackTitle(resourceType),
      permalink: permalink ?? getFallbackPermalink(resourceType),
      siteId: site.id,
      parentId,
      publishedVersionId: null,
      draftBlobId: blob.id,
      type: resourceType,
      state,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  if (state === ResourceState.Published && userId) {
    const version = await db
      .insertInto("Version")
      .values({
        versionNum: 1,
        resourceId: page.id,
        blobId: blob.id,
        publishedBy: userId,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    page = await db
      .updateTable("Resource")
      .where("id", "=", page.id)
      .set({
        publishedVersionId: version.id,
        draftBlobId: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  return {
    site,
    navbar,
    footer,
    blob,
    page,
  }
}

export const setupFolder = async ({
  siteId: siteIdProp,
  permalink = "test-folder",
  parentId = null,
  title = "test folder",
}: {
  siteId?: number
  permalink?: string
  parentId?: string | null
  title?: string
} = {}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)

  const folder = await db
    .insertInto("Resource")
    .values({
      permalink,
      siteId: site.id,
      parentId,
      title,
      draftBlobId: null,
      state: ResourceState.Draft,
      type: ResourceType.Folder,
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    site,
    navbar,
    footer,
    folder,
  }
}

export const setupCollection = async ({
  siteId: siteIdProp,
  permalink = "test-collection",
  parentId = null,
  title = "test collection",
}: {
  siteId?: number
  permalink?: string
  parentId?: string | null
  title?: string
}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)

  const collection = await db
    .insertInto("Resource")
    .values({
      permalink,
      siteId: site.id,
      parentId,
      title,
      draftBlobId: null,
      state: ResourceState.Draft,
      type: ResourceType.Collection,
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    site,
    navbar,
    footer,
    collection,
  }
}

export const setupCollectionLink = async ({
  siteId: siteIdProp,
  permalink = "test-collection-link",
  collectionId,
  title = "test collection link",
}: {
  siteId?: number
  permalink?: string
  collectionId: string
  title?: string
}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)

  const collectionLink = await db
    .insertInto("Resource")
    .values({
      permalink,
      siteId: site.id,
      parentId: collectionId,
      title,
      type: ResourceType.CollectionLink,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    site,
    navbar,
    footer,
    collectionLink,
  }
}

export const setupFolderMeta = async ({
  siteId: siteIdProp,
  folderId,
}: {
  siteId?: number
  folderId: string
}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)

  const folderMeta = await db
    .insertInto("Resource")
    .values({
      siteId: site.id,
      parentId: folderId,
      title: "Folder meta",
      permalink: "folder-meta",
      type: ResourceType.FolderMeta,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    site,
    navbar,
    footer,
    folderMeta,
  }
}

export const setUpWhitelist = async ({
  email,
  expiry,
}: {
  email: string
  expiry?: Date
}) => {
  return db
    .insertInto("Whitelist")
    .values({
      email: email.toLowerCase(),
      expiry: expiry ?? null,
    })
    .onConflict((oc) =>
      oc
        .column("email")
        .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
    )
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const setupUser = async ({
  name = "Test User",
  userId = nanoid(),
  email,
  phone = "",
  isDeleted,
  hasLoggedIn = false,
}: {
  name?: string
  userId?: string
  email: string
  phone?: string
  isDeleted?: boolean
  hasLoggedIn?: boolean
}) => {
  return db
    .insertInto("User")
    .values({
      id: userId,
      name,
      email,
      phone: phone,
      deletedAt: isDeleted ? MOCK_STORY_DATE : null,
      lastLoginAt: hasLoggedIn ? MOCK_STORY_DATE : null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}
