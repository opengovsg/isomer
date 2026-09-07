import type { UnwrapTagged } from "type-fest"
import type { CodeBuildJobs } from "~prisma/generated/prisma/client"
import { nanoid } from "nanoid"
import { INDEX_PAGE_PERMALINK } from "src/constants/sitemap"
import { MOCK_STORY_DATE } from "tests/msw/constants"
import { buildIdFromArn } from "~/schemas/webhook"
import {
  IsomerAdminRole,
  ResourceState,
  ResourceType,
  RoleType,
} from "~prisma/generated/generatedEnums"
import { db, jsonb } from "~server/db"

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
  if (!userId) {
    throw new Error("userId is a required field")
  }

  const time = useCurrentTime ? new Date() : MOCK_STORY_DATE
  return await db
    .insertInto("ResourcePermission")
    .values({
      createdAt: time,
      deletedAt: isDeleted ? time : null,
      resourceId: null,
      role,
      siteId,
      updatedAt: time,
      userId: String(userId),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const setupPublisherPermissions = async (
  props: Omit<SetupPermissionsProps, "role">,
) => await setupPermissions({ ...props, role: RoleType.Publisher })

export const setupEditorPermissions = async (
  props: Omit<SetupPermissionsProps, "role">,
) => await setupPermissions({ ...props, role: RoleType.Editor })

export const setupAdminPermissions = async (
  props: Omit<SetupPermissionsProps, "role">,
) => await setupPermissions({ ...props, role: RoleType.Admin })

export const setupSite = async (siteId?: number, fetch?: boolean) => {
  if (siteId !== undefined && fetch) {
    return await db.transaction().execute(async (tx) => {
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

      return { footer, navbar, site }
    })
  }

  const name = `Ministry of Testing and Development ${nanoid()}`
  return await db.transaction().execute(async (tx) => {
    const site = await tx
      .insertInto("Site")
      .values({
        name,
        config: jsonb({
          isGovernment: true,
          logoUrl: "",
          siteName: name,
          theme: "isomer-next",
          url: "",
        }),
        // @ts-expect-error id is GeneratedAlways but we override it for tests
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
        content: jsonb({
          items: [
            {
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
                {
                  url: "/item-one/pa-network-three",
                  name: "PA's network three",
                },
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
              name: "Expandable nav item",
              url: "/item-one",
            },
          ],
        }),
        siteId: site.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // // Insert footer
    const footer = await tx
      .insertInto("Footer")
      .values({
        content: jsonb({
          contactUsLink: "/contact-us",
          feedbackFormLink: "https://www.form.gov.sg",
          privacyStatementLink: "/privacy",
          siteNavItems: [
            { url: "/about", title: "About us" },
            { url: "/partners", title: "Our partners" },
            { url: "/grants-and-programmes", title: "Grants and programmes" },
            { url: "/contact-us", title: "Contact us" },
            { url: "/something-else", title: "Something else" },
            { url: "/resources", title: "Resources" },
          ],
          termsOfUseLink: "/terms-of-use",
        }),
        siteId: site.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return { footer, navbar, site }
  })
}

export const setupBlob = async (blobId?: string) => {
  if (blobId !== undefined) {
    return await db
      .selectFrom("Blob")
      .where("id", "=", blobId)
      .selectAll()
      .executeTakeFirstOrThrow()
  }
  return await db
    .insertInto("Blob")
    .values({
      content: jsonb({
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
        layout: "content",
        page: {
          contentPageHeader: { summary: "This is the page summary" },
        },
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

const getFallbackTitle = (resourceType: ResourceType) => {
  switch (resourceType) {
    case ResourceType.RootPage: {
      return "Home"
    }
    case ResourceType.CollectionPage: {
      return "test collection page"
    }
    case ResourceType.IndexPage: {
      return "test index page"
    }
    default: {
      return "test page"
    }
  }
}

const getFallbackPermalink = (resourceType: ResourceType) => {
  switch (resourceType) {
    case ResourceType.RootPage: {
      return ""
    }
    case ResourceType.CollectionPage: {
      return "test-collection-page"
    }
    case ResourceType.IndexPage: {
      return INDEX_PAGE_PERMALINK
    }
    default: {
      return "test-page"
    }
  }
}

interface SetupPageResourceProps {
  siteId?: number
  blobId?: string
  resourceType: ResourceType
  state?: ResourceState
  userId?: string
  permalink?: string
  parentId?: string | null
  title?: string
  scheduledAt?: Date | null
  scheduledBy?: string | null
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
  scheduledAt = null,
  scheduledBy = null,
}: SetupPageResourceProps) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)
  const blob = await setupBlob(blobIdProp)

  let page = await db
    .insertInto("Resource")
    .values({
      draftBlobId: blob.id,
      parentId,
      permalink: permalink ?? getFallbackPermalink(resourceType),
      publishedVersionId: null,
      scheduledAt,
      scheduledBy,
      siteId: site.id,
      state,
      title: title ?? getFallbackTitle(resourceType),
      type: resourceType,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  if (state === ResourceState.Published && !userId) {
    throw new Error(
      "Precondition failed, we need a valid `userId` in order to publish",
    )
  }

  if (state === ResourceState.Published && userId) {
    const version = await db
      .insertInto("Version")
      .values({
        blobId: blob.id,
        publishedBy: userId,
        resourceId: page.id,
        versionNum: 1,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    page = await db
      .updateTable("Resource")
      .where("id", "=", page.id)
      .set({
        draftBlobId: null,
        publishedVersionId: version.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  return {
    blob,
    footer,
    navbar,
    page,
    site,
  }
}

export const setupFolder = async ({
  siteId: siteIdProp,
  permalink = "test-folder",
  parentId = null,
  title = "test folder",
  state = ResourceState.Draft,
}: {
  siteId?: number
  permalink?: string
  parentId?: string | null
  title?: string
  state?: ResourceState
} = {}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)

  const folder = await db
    .insertInto("Resource")
    .values({
      draftBlobId: null,
      parentId,
      permalink,
      publishedVersionId: null,
      siteId: site.id,
      state,
      title,
      type: ResourceType.Folder,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    folder,
    footer,
    navbar,
    site,
  }
}

export const setupCollection = async ({
  siteId: siteIdProp,
  permalink = "test-collection",
  parentId = null,
  title = "test collection",
  state = ResourceState.Draft,
}: {
  siteId?: number
  permalink?: string
  parentId?: string | null
  title?: string
  state?: ResourceState
} = {}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)

  const collection = await db
    .insertInto("Resource")
    .values({
      draftBlobId: null,
      parentId,
      permalink,
      publishedVersionId: null,
      siteId: site.id,
      state,
      title,
      type: ResourceType.Collection,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    collection,
    footer,
    navbar,
    site,
  }
}

export const collectionPageBlobContent = (
  tagged: string[] = [],
): UnwrapTagged<PrismaJson.BlobJsonContent> => ({
  content: [],
  layout: "article",
  page: {
    articlePageHeader: {
      summary: "A concise summary of the main points regarding this article.",
    },
    category: "Feature Articles",
    date: "01/01/2026",
    tagged,
  },
  version: "0.1.0",
})

export const setupCollectionPage = async (
  args: Omit<SetupPageResourceProps, "resourceType" | "blobId"> & {
    tagged?: string[]
  },
) => {
  const { tagged = [], ...rest } = args

  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb(collectionPageBlobContent(tagged)),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const { page } = await setupPageResource({
    ...rest,
    blobId: blob.id,
    resourceType: ResourceType.CollectionPage,
  })

  return { blob, page }
}

export const setupCollectionLink = async ({
  siteId: siteIdProp,
  permalink = "test-collection-link",
  collectionId,
  title = "test collection link",
  state = ResourceState.Draft,
  userId,
}: {
  siteId?: number
  permalink?: string
  collectionId: string
  title?: string
  state?: ResourceState
  userId?: string
}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)
  const blob = await setupBlob()

  let collectionLink = await db
    .insertInto("Resource")
    .values({
      draftBlobId: blob.id,
      parentId: collectionId,
      permalink,
      siteId: site.id,
      state,
      title,
      type: ResourceType.CollectionLink,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  if (state === ResourceState.Published && !userId) {
    throw new Error(
      "Precondition failed, we need a valid `userId` in order to publish",
    )
  }

  if (state === ResourceState.Published && userId) {
    const version = await db
      .insertInto("Version")
      .values({
        blobId: blob.id,
        publishedBy: userId,
        resourceId: collectionLink.id,
        versionNum: 1,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    collectionLink = await db
      .updateTable("Resource")
      .where("id", "=", collectionLink.id)
      .set({
        draftBlobId: null,
        publishedVersionId: version.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  return {
    blob,
    collectionLink,
    footer,
    navbar,
    site,
  }
}

export const setupCollectionMeta = async ({
  siteId: siteIdProp,
  collectionId,
}: {
  siteId?: number
  collectionId: string
}) => {
  const { site, navbar, footer } = await setupSite(siteIdProp, !!siteIdProp)

  const collectionMeta = await db
    .insertInto("Resource")
    .values({
      parentId: collectionId,
      permalink: "collection-meta",
      siteId: site.id,
      title: "collection meta",
      type: ResourceType.CollectionMeta,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    collectionMeta,
    footer,
    navbar,
    site,
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
      parentId: folderId,
      permalink: "folder-meta",
      siteId: site.id,
      title: "Folder meta",
      type: ResourceType.FolderMeta,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    folderMeta,
    footer,
    navbar,
    site,
  }
}

export const setUpWhitelist = async ({
  email,
  expiry,
}: {
  email: string
  expiry?: Date
}) =>
  await db
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

export const setupIsomerAdmin = async ({
  userId,
  role = IsomerAdminRole.Core,
  expiry = null,
}: {
  userId: string
  role?: IsomerAdminRole
  expiry?: Date | null
}) =>
  await db
    .insertInto("IsomerAdmin")
    .values({ userId, role, expiry })
    .returningAll()
    .executeTakeFirstOrThrow()

export const setupUser = async ({
  name = "Test User",
  userId = nanoid(),
  email,
  phone = "",
  isDeleted = false,
  lastLoginAt = null,
}: {
  name?: string
  userId?: string
  email?: string
  phone?: string
  isDeleted?: boolean
  lastLoginAt?: Date | null
}) =>
  await db
    .insertInto("User")
    .values({
      id: userId,
      name,
      email: email ?? `${nanoid()}@test.com`,
      phone,
      deletedAt: isDeleted ? MOCK_STORY_DATE : null,
      lastLoginAt,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

export const setupFullSite = async () => {
  const { site, folder: parentFolder } = await setupFolder({})
  const { page: rootPage } = await setupPageResource({
    resourceType: "RootPage",
    siteId: site.id,
  })
  const { page: childPage } = await setupPageResource({
    parentId: parentFolder.id,
    resourceType: "Page",
    siteId: site.id,
  })
  const { folder } = await setupFolder({
    parentId: parentFolder.id,
    siteId: site.id,
  })
  const { collection } = await setupCollection({
    siteId: site.id,
  })

  const { page: collectionPage } = await setupPageResource({
    parentId: collection.id,
    resourceType: "CollectionPage",
  })
  const { page: collectionLink } = await setupPageResource({
    parentId: collection.id,
    resourceType: "CollectionLink",
  })
  const { page: collectionIndex } = await setupPageResource({
    parentId: collection.id,
    resourceType: "IndexPage",
  })

  return {
    childFolder: folder,
    childPage,
    collectionIndex,
    collectionLink,
    collectionPage,
    rootCollection: collection,
    rootFolder: parentFolder,
    rootPage,
    site,
  }
}

type SetupCodeBuildJobParams = Pick<CodeBuildJobs, "userId" | "startedAt"> & {
  arn: string
} & Partial<Pick<CodeBuildJobs, "status" | "emailSent" | "isScheduled">> & {
    omitResourceId?: boolean
    siteId?: number
    permalink?: string
  }

export const setupCodeBuildJob = async ({
  userId,
  startedAt,
  isScheduled,
  arn,
  siteId,
  permalink,
  status = "IN_PROGRESS",
  emailSent = false,
  omitResourceId = false,
}: SetupCodeBuildJobParams) => {
  const buildId = buildIdFromArn(arn)
  if (!buildId) {
    throw new Error(`Invalid buildId format: ${arn}`)
  }
  const { page, site } = await setupPageResource({
    permalink,
    resourceType: ResourceType.Page,
    siteId,
  })
  const codebuildJob = await db
    .insertInto("CodeBuildJobs")
    .values({
      buildId,
      emailSent,
      isScheduled,
      resourceId: omitResourceId ? null : page.id,
      siteId: site.id,
      startedAt,
      status,
      userId,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { codebuildJob, page, site }
}

export const createSupersededBuildRows = async ({
  supersedingBuild,
  resourceId,
  userId,
  numberOfSupersededBuilds = 1,
}: {
  supersedingBuild: Omit<CodeBuildJobs, "resourceId" | "userId" | "id">
  resourceId: string
  // the resourceId does NOT need to be the same as the superseding build
  userId: string
  // the userId does NOT need to be the same as the superseding build
  numberOfSupersededBuilds?: number
}) => {
  await db
    .insertInto("CodeBuildJobs")
    .values(
      Array.from({ length: numberOfSupersededBuilds }).map((_, i) => ({
        buildId: `test-build-id-superseded-${i}`,
        isScheduled: supersedingBuild.isScheduled,
        resourceId,
        siteId: supersedingBuild.siteId,
        startedAt: supersedingBuild.startedAt,
        supersededByBuildId: supersedingBuild.buildId,
        userId,
      })),
    )
    .execute()
}
