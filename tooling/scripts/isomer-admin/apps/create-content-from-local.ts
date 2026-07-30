import type { Client } from "pg"
import { confirm, input, select } from "@inquirer/prompts"
import fs from "fs"
import path from "path"

import type { AssetsMap } from "../types"
import { withDbClient } from "../utils/db"
import { migrateTagsOfCollection } from "../utils/migrate-tags"
import { prepareAssets, writeAssetMappingCsv } from "../utils/prepare-assets"
import { studioifyContainerPublished } from "../utils/studioify"

type PageContent = {
  layout?: string
  page?: {
    title?: string
    contentPageHeader?: { summary?: string }
  }
  content?: unknown[]
  version?: string
}

const INPUT_DIR = path.join(__dirname, "input")
const ASSETS_INPUT_DIR = path.join(INPUT_DIR, "assets")
const SCHEMAS_INPUT_DIR = path.join(INPUT_DIR, "schemas")
const ASSETS_OUTPUT_DIR = "./output"

const isJsonFile = (filename: string): boolean =>
  filename.endsWith(".json") && !filename.startsWith(".")

type ContainerType = "Collection" | "Folder"
type ChildPageType = "IndexPage" | "CollectionPage" | "CollectionLink" | "Page"

const getChildPageType = (
  containerType: ContainerType,
  content: PageContent,
): ChildPageType => {
  if (containerType === "Folder") {
    return "Page"
  }

  return content.layout === "link" ? "CollectionLink" : "CollectionPage"
}

const normalizePageContent = (content: PageContent): PageContent => {
  if (content.layout === "file") {
    return { ...content, layout: "link" }
  }

  return content
}

const readJsonFile = (filePath: string): PageContent => {
  const rawContent = fs.readFileSync(filePath, "utf-8")
  return normalizePageContent(JSON.parse(rawContent) as PageContent)
}

const getDefaultIndexPageContent = (title: string): PageContent => ({
  page: {
    title,
    contentPageHeader: {
      summary: `Pages in ${title}`,
    },
  },
  layout: "index",
  content: [
    {
      type: "childrenpages",
      variant: "rows",
      showSummary: true,
      showThumbnail: false,
    },
  ],
  version: "0.1.0",
})

const resolveIndexPage = ({
  indexPagePath,
  containerTitle,
}: {
  indexPagePath: string | null
  containerTitle: string
}): { content: PageContent; title: string } => {
  if (!indexPagePath) {
    return {
      content: getDefaultIndexPageContent(containerTitle),
      title: containerTitle,
    }
  }

  const content = readJsonFile(indexPagePath)

  return {
    content,
    title: content.page?.title ?? containerTitle,
  }
}

const assertRowExists = async (
  client: Client,
  query: string,
  params: unknown[],
  errorMessage: string,
): Promise<void> => {
  const result = await client.query<{ id: string }>(query, params)

  if (!result.rows[0]) {
    throw new Error(errorMessage)
  }
}

const insertPublishedResource = async (
  client: Client,
  {
    title,
    permalink,
    parentId,
    siteId,
    type,
  }: {
    title: string
    permalink: string
    parentId: string | null
    siteId: string
    type: ContainerType | ChildPageType
  },
): Promise<string> => {
  const resourceResult = await client.query<{ id: string }>(
    `INSERT INTO "Resource" (
      title, permalink, "parentId", type, state, "siteId", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, 'Published', $5, NOW(), NOW()) RETURNING id`,
    [title, permalink, parentId, type, siteId],
  )
  const resourceId = resourceResult.rows[0]?.id

  if (!resourceId) {
    throw new Error(`Failed to create resource "${permalink}"`)
  }

  return resourceId
}

const insertPublishedContainer = async (
  client: Client,
  {
    title,
    permalink,
    parentId,
    siteId,
    containerType,
  }: {
    title: string
    permalink: string
    parentId: string | null
    siteId: string
    containerType: ContainerType
  },
): Promise<string> =>
  insertPublishedResource(client, {
    title,
    permalink,
    parentId,
    siteId,
    type: containerType,
  })

const insertPublishedChildResource = async (
  client: Client,
  {
    title,
    permalink,
    parentId,
    siteId,
    type,
    content,
    publisherId,
  }: {
    title: string
    permalink: string
    parentId: string
    siteId: string
    type: ChildPageType
    content: PageContent
    publisherId: string
  },
): Promise<string> => {
  const blobResult = await client.query<{ id: string }>(
    `INSERT INTO "Blob" (content) VALUES ($1) RETURNING id`,
    [JSON.stringify(content)],
  )
  const blobId = blobResult.rows[0]?.id

  if (!blobId) {
    throw new Error(`Failed to create blob for permalink "${permalink}"`)
  }

  const resourceId = await insertPublishedResource(client, {
    title,
    permalink,
    parentId,
    siteId,
    type,
  })

  const versionResult = await client.query<{ id: string }>(
    `INSERT INTO "Version" ("blobId", "versionNum", "resourceId", "publishedBy", "publishedAt", "updatedAt")
     VALUES ($1, 1, $2, $3, NOW(), NOW())
     RETURNING id`,
    [blobId, resourceId, publisherId],
  )
  const versionId = versionResult.rows[0]?.id

  if (!versionId) {
    throw new Error(`Failed to create version for permalink "${permalink}"`)
  }

  await client.query(
    `UPDATE "Resource" SET "publishedVersionId" = $1, "updatedAt" = NOW() WHERE id = $2`,
    [versionId, resourceId],
  )

  return resourceId
}

const validateSite = async (client: Client, siteId: string): Promise<void> => {
  await assertRowExists(
    client,
    `SELECT id FROM "Site" WHERE id = $1`,
    [siteId],
    `Site with ID ${siteId} was not found`,
  )
}

const resolvePublisherId = async (
  client: Client,
  email: string,
): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM "User" WHERE email = $1 AND "deletedAt" IS NULL`,
    [email],
  )
  const user = result.rows[0]
  if (!user) {
    throw new Error(`User with email ${email} was not found`)
  }
  return user.id
}

const validateParentFolder = async (
  client: Client,
  parentFolderId: string,
  siteId: string,
): Promise<void> => {
  const parentResult = await client.query<{
    id: string
    type: string
    siteId: string
  }>(`SELECT id, type, "siteId" FROM "Resource" WHERE id = $1`, [
    parentFolderId,
  ])

  const parent = parentResult.rows[0]

  if (!parent) {
    throw new Error(`Parent folder with ID ${parentFolderId} was not found`)
  }

  if (parent.type !== "Folder") {
    throw new Error(
      `Resource ${parentFolderId} is type "${parent.type}", expected "Folder"`,
    )
  }

  if (String(parent.siteId) !== siteId) {
    throw new Error(
      `Parent folder ${parentFolderId} belongs to site ${parent.siteId}, not site ${siteId}`,
    )
  }
}

export const createContentFromLocal = async () => {
  const containerPermalink = (
    await input({
      message:
        "Enter the container permalink (e.g. conservation-portal — no leading slash)",
      validate: (value) =>
        value.trim().length > 0 ? true : "Permalink is required",
    })
  )
    .trim()
    .replace(/^\/+|\/+$/g, "")

  const containerTitle = (
    await input({
      message: "Enter the container name / title",
      validate: (value) =>
        value.trim().length > 0 ? true : "Title is required",
    })
  ).trim()

  const indexPagePathInput = (
    await input({
      message:
        "Enter the index page JSON path (optional — leave blank to auto-create or use input/_index.json)",
      default: "",
    })
  ).trim()
  const INDEX_PAGE_PATH: string | null =
    indexPagePathInput.length > 0 ? indexPagePathInput : null

  const siteId = await input({
    message: "Enter the site ID (required)",
    validate: (value) =>
      /^\d+$/.test(value) ? true : "Enter a numeric site ID",
  })

  const containerType = await select<ContainerType>({
    message: "What type of container are you creating?",
    choices: [
      { name: "Collection", value: "Collection" },
      { name: "Folder", value: "Folder" },
    ],
  })

  const parentFolderIdInput = await input({
    message:
      "Enter the parent folder resource ID (optional — leave blank for site root)",
    default: "",
  })
  const parentFolderId = parentFolderIdInput.trim() || null

  const publisherEmail = (
    await input({
      message: "Enter the publisher email address (e.g. name@open.gov.sg)",
      validate: (value) =>
        value.trim().length > 0 ? true : "Publisher email is required",
    })
  ).trim()

  console.log(
    `Using ${containerType.toLowerCase()} permalink "${containerPermalink}" and name "${containerTitle}"`,
  )

  const defaultIndexPath = path.join(INPUT_DIR, "_index.json")
  const configuredIndexPath = INDEX_PAGE_PATH
  let indexPagePath: string | null

  if (configuredIndexPath !== null) {
    if (!fs.existsSync(configuredIndexPath)) {
      console.error("Index page not found:", configuredIndexPath)
      return
    }
    indexPagePath = configuredIndexPath
  } else {
    indexPagePath = fs.existsSync(defaultIndexPath) ? defaultIndexPath : null
  }

  const hasPlacedSchemas = await confirm({
    message: `Have you placed page JSON files in ${SCHEMAS_INPUT_DIR}?`,
    default: true,
  })

  if (!hasPlacedSchemas) {
    console.log(`Place schema files in ${SCHEMAS_INPUT_DIR}, then try again.`)
    return
  }

  if (!fs.existsSync(SCHEMAS_INPUT_DIR)) {
    console.error(`Schemas directory not found: ${SCHEMAS_INPUT_DIR}`)
    return
  }

  const shouldPrepareAssets = await confirm({
    message: `Prepare assets from ${ASSETS_INPUT_DIR}?`,
    default: true,
  })

  let assetsMap: AssetsMap = {}

  if (shouldPrepareAssets) {
    const hasPlacedAssets = await confirm({
      message: `Have you placed assets in ${ASSETS_INPUT_DIR} (images/ and files/ subfolders, or flat files)?`,
      default: true,
    })

    if (!hasPlacedAssets) {
      console.log(`Place asset files in ${ASSETS_INPUT_DIR}, then try again.`)
      return
    }

    assetsMap = prepareAssets({
      siteId,
      inputDir: ASSETS_INPUT_DIR,
      outputDir: ASSETS_OUTPUT_DIR,
    })

    const csvPath = writeAssetMappingCsv({ siteId, assetsMap })
    console.log(`Asset mapping written to ${csvPath}`)
    console.log(
      `Upload ${path.join(ASSETS_OUTPUT_DIR, siteId)} to the assets S3 bucket before rebuilding the site.`,
    )
  }

  const { content: indexPageContent, title: indexPageTitle } = resolveIndexPage(
    {
      indexPagePath,
      containerTitle,
    },
  )

  if (indexPagePath) {
    console.log(`Using index page from ${indexPagePath}`)
  } else {
    console.log(
      `No index page at ${defaultIndexPath} — auto-creating default index page.`,
    )
  }

  const pageFiles = fs
    .readdirSync(SCHEMAS_INPUT_DIR)
    .filter(isJsonFile)
    .filter((file) => file !== "_index.json")

  const pagesToCreate: Array<{
    permalink: string
    content: PageContent
  }> = []

  for (const fileName of pageFiles) {
    const filePath = path.join(SCHEMAS_INPUT_DIR, fileName)
    const content = readJsonFile(filePath)
    const permalink = fileName.replace(/\.json$/i, "")

    pagesToCreate.push({ permalink, content })
  }

  const parentLabel = parentFolderId ?? "site root"
  const shouldCreate = await confirm({
    message: `Create ${containerType.toLowerCase()} "${containerPermalink}" under ${parentLabel} with ${pagesToCreate.length + 1} published page(s), then studioify?`,
    default: true,
  })

  if (!shouldCreate) {
    console.log("Create cancelled.")
    return
  }

  await withDbClient(async (client) => {
    await validateSite(client, siteId)
    const publisherId = await resolvePublisherId(client, publisherEmail)

    if (parentFolderId) {
      await validateParentFolder(client, parentFolderId, siteId)
    }

    await client.query("BEGIN")

    try {
      const containerId = await insertPublishedContainer(client, {
        title: containerTitle,
        permalink: containerPermalink,
        parentId: parentFolderId,
        siteId,
        containerType,
      })
      console.log(
        `Created published ${containerType.toLowerCase()} "${containerPermalink}" (resource ID ${containerId})`,
      )

      const indexPageId = await insertPublishedChildResource(client, {
        title: indexPageTitle,
        permalink: "_index",
        parentId: containerId,
        siteId,
        type: "IndexPage",
        content: indexPageContent,
        publisherId,
      })
      console.log(`Created published index page (resource ID ${indexPageId})`)

      for (const page of pagesToCreate) {
        const title = page.content.page?.title ?? page.permalink
        const type = getChildPageType(containerType, page.content)
        const resourceId = await insertPublishedChildResource(client, {
          title,
          permalink: page.permalink,
          parentId: containerId,
          siteId,
          type,
          content: page.content,
          publisherId,
        })

        console.log(
          `Created published ${type} "${page.permalink}" (resource ID ${resourceId})`,
        )
      }

      const studioifiedCount = await studioifyContainerPublished({
        client,
        siteId,
        containerId,
        assetsMap,
      })
      console.log(
        `Studioified ${studioifiedCount} published page(s) (asset paths and internal links).`,
      )

      if (containerType === "Collection") {
        const migratedCount = await migrateTagsOfCollection({
          client,
          collectionId: containerId,
        })
        if (migratedCount > 0) {
          console.log(
            `Migrated legacy tags to tagCategories on ${migratedCount} published page(s).`,
          )
        }
      }

      await client.query("COMMIT")

      console.log(`${containerType} created and published.`)
      console.log(
        "Next steps: upload assets to S3 (if prepared), then manually trigger a site rebuild in CodeBuild.",
      )
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    }
  })
}
