import type { UnwrapTagged } from "type-fest"
import { mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import {
  db,
  jsonb,
  ResourceState,
  ResourceType,
  type DB,
  type Transaction,
} from "~/server/modules/database"

import {
  buildConversionReport,
  toFolderPlan,
  type ConversionPlan,
  type FolderPlan,
  type PagePlan,
} from "./helpers"

// ---------------------------------------------------------------------------
// Blob helpers (local copies — avoid resource.service, which imports
// @opengovsg/isomer-components at runtime and breaks under tsx)
// ---------------------------------------------------------------------------

type ScriptDb = Pick<typeof db, "selectFrom">

export const getBlobOfResource = async ({
  db: database,
  resourceId,
}: {
  db: ScriptDb
  resourceId: string
}) => {
  const { draftBlobId, publishedVersionId } = await database
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select(["draftBlobId", "publishedVersionId"])
    .executeTakeFirstOrThrow(
      () => new Error(`Resource ${resourceId} not found`),
    )

  if (draftBlobId) {
    return database
      .selectFrom("Blob")
      .where("id", "=", draftBlobId)
      .selectAll()
      .executeTakeFirstOrThrow()
  }

  if (!publishedVersionId) {
    throw new Error(
      `Resource ${resourceId} has no draft blob and no published version`,
    )
  }

  return database
    .selectFrom("Blob")
    .selectAll()
    .where("Blob.id", "=", (eb) =>
      eb
        .selectFrom("Version")
        .where("id", "=", publishedVersionId)
        .select("blobId"),
    )
    .executeTakeFirstOrThrow()
}

export const updateBlobById = async (
  tx: Transaction<DB>,
  {
    pageId,
    content,
    siteId,
  }: {
    pageId: number
    content: UnwrapTagged<PrismaJson.BlobJsonContent>
    siteId: number
  },
) => {
  const page = await tx
    .selectFrom("Resource")
    .where("Resource.id", "=", String(pageId))
    .where("siteId", "=", siteId)
    .select("draftBlobId")
    .executeTakeFirst()

  if (!page) {
    throw new Error(`Resource ${pageId} not found`)
  }

  if (!page.draftBlobId) {
    const newBlob = await tx
      .insertInto("Blob")
      .values({ content: jsonb(content) })
      .returningAll()
      .executeTakeFirstOrThrow()
    await tx
      .updateTable("Resource")
      .where("id", "=", String(pageId))
      .set({ draftBlobId: newBlob.id })
      .execute()
    return newBlob
  }

  return tx
    .updateTable("Blob")
    .set({ content: jsonb(content) })
    .where("Blob.id", "=", page.draftBlobId)
    .returningAll()
    .executeTakeFirstOrThrow()
}

interface ScriptVersion {
  id: string
  versionNum: number
}

/** Local copy — version.service imports resource.service (→ isomer-components). */
export const incrementVersion = async ({
  siteId,
  resourceId,
  userId,
  tx,
}: {
  siteId: number
  tx: Transaction<DB>
  resourceId: string
  userId: string
}): Promise<{
  previousVersion: ScriptVersion | null
  newVersion: ScriptVersion
} | null> => {
  const page = await tx
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .where("siteId", "=", siteId)
    .select(["draftBlobId", "publishedVersionId"])
    .executeTakeFirst()

  if (!page) {
    throw new Error(`Resource ${resourceId} not found`)
  }
  if (!page.draftBlobId) return null

  let newVersionNum = 1
  let previousVersion: ScriptVersion | null = null
  if (page.publishedVersionId) {
    previousVersion = await tx
      .selectFrom("Version")
      .where("id", "=", page.publishedVersionId)
      .select(["id", "versionNum"])
      .executeTakeFirstOrThrow()
    newVersionNum = previousVersion.versionNum + 1
  }

  const newVersion = await tx
    .insertInto("Version")
    .values({
      versionNum: newVersionNum,
      resourceId,
      blobId: page.draftBlobId,
      publishedAt: new Date(),
      publishedBy: userId,
    })
    .returning(["id", "versionNum"])
    .executeTakeFirstOrThrow()

  await tx
    .updateTable("Resource")
    .set({
      publishedVersionId: newVersion.id,
      draftBlobId: null,
      state: ResourceState.Published,
    })
    .where("id", "=", resourceId)
    .where("siteId", "=", siteId)
    .execute()

  return { newVersion, previousVersion }
}

// ---------------------------------------------------------------------------
// DB verification
// ---------------------------------------------------------------------------

export const verifySite = async (siteId: number) => {
  const site = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select(["id", "name"])
    .executeTakeFirst()
  if (!site) throw new Error(`Site ${siteId} not found`)
  return site
}

export const verifyFolder = async (folderId: string, siteId: number) => {
  const folder = await db
    .selectFrom("Resource")
    .where("id", "=", folderId)
    .where("siteId", "=", siteId)
    .select(["id", "siteId", "title", "permalink", "type"])
    .executeTakeFirst()
  if (!folder) {
    throw new Error(`Resource ${folderId} not found on site ${siteId}`)
  }
  if (folder.type !== ResourceType.Folder) {
    throw new Error(
      `Resource ${folderId} is type=${folder.type}, expected Folder`,
    )
  }
  return folder
}

export const verifyUser = async (userId: string) => {
  const user = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .select("id")
    .executeTakeFirst()
  if (!user) throw new Error(`User ${userId} not found`)
  return user
}

// ---------------------------------------------------------------------------
// Plan + report I/O
// ---------------------------------------------------------------------------

const defaultOutDir = () =>
  join(dirname(fileURLToPath(import.meta.url)), ".out")

export const folderPlanFileName = (folderId: string) =>
  `convert-folder-${folderId}.json`

export const resourcePlanFileName = (resourceId: string) =>
  `convert-resource-${resourceId}.json`

const writeJson = (
  fileName: string,
  data: unknown,
  baseDir: string = defaultOutDir(),
) => {
  mkdirSync(baseDir, { recursive: true })
  const file = join(baseDir, fileName)
  writeFileSync(file, JSON.stringify(data, null, 2))
  return file
}

export const writePlanFiles = (
  plan: ConversionPlan,
  baseDir: string = defaultOutDir(),
): string[] => {
  const paths = [
    writeJson(folderPlanFileName(plan.folder.id), toFolderPlan(plan), baseDir),
    writeJson(
      resourcePlanFileName(plan.indexPage.resourceId),
      plan.indexPage,
      baseDir,
    ),
    ...plan.pages.map((p) =>
      writeJson(resourcePlanFileName(p.resourceId), p, baseDir),
    ),
  ]
  return paths
}

export const loadConversionPlan = (
  folderId: string,
  baseDir: string = defaultOutDir(),
): ConversionPlan => {
  const folderPath = join(baseDir, folderPlanFileName(folderId))
  const folderPlan = JSON.parse(readFileSync(folderPath, "utf-8")) as FolderPlan

  const readResource = (resourceId: string): PagePlan =>
    JSON.parse(
      readFileSync(join(baseDir, resourcePlanFileName(resourceId)), "utf-8"),
    ) as PagePlan

  return {
    folder: {
      id: folderPlan.id,
      siteId: folderPlan.siteId,
      title: folderPlan.title,
      permalink: folderPlan.permalink,
    },
    defaultCategory: folderPlan.defaultCategory,
    indexPage: readResource(folderPlan.indexPageId),
    pages: folderPlan.pageIds.map(readResource),
  }
}

export const loadConversionPlanFromPath = (
  path: string,
  baseDir: string = defaultOutDir(),
): ConversionPlan => {
  const folderPlan = JSON.parse(readFileSync(path, "utf-8")) as FolderPlan
  return loadConversionPlan(folderPlan.id, baseDir)
}

export const findPlanForFolder = (
  folderId: string,
  baseDir: string = defaultOutDir(),
): string | undefined => {
  const file = join(baseDir, folderPlanFileName(folderId))
  try {
    readFileSync(file)
    return file
  } catch {
    return undefined
  }
}

export const writeReportFile = (
  plan: ConversionPlan,
  baseDir: string = defaultOutDir(),
): string => {
  const fileName = folderPlanFileName(plan.folder.id).replace(
    /\.json$/,
    ".report.json",
  )
  mkdirSync(baseDir, { recursive: true })
  const reportPath = join(baseDir, fileName)
  writeFileSync(
    reportPath,
    JSON.stringify(buildConversionReport(plan), null, 2),
  )
  return reportPath
}

// ---------------------------------------------------------------------------
// Console preview
// ---------------------------------------------------------------------------

export const printPlan = (plan: ConversionPlan) => {
  console.log("\n=== Folder → Collection conversion preview ===")
  console.log(`Folder      : ${plan.folder.title} (id=${plan.folder.id})`)
  console.log(`Site        : ${plan.folder.siteId}`)
  console.log(`Permalink   : ${plan.folder.permalink}`)
  console.log(`Default category for articles: "${plan.defaultCategory}"`)
  console.log(`Total pages : ${plan.pages.length}`)
  console.log(
    `\nIndex page  : "${plan.indexPage.title}" → layout=collection (subtitle from contentPageHeader.summary)`,
  )

  const flaggedTypes = new Map<string, number>()
  console.log("\nPages:")
  for (const p of plan.pages) {
    const contentBlocks = p.currentBlob.content
    const flagStr =
      p.disallowedBlocks.length > 0
        ? ` ⚠ disallowed-in-article blocks: ${p.disallowedBlocks
            .map((b) => `${b.type}@${b.index}`)
            .join(", ")}`
        : ""
    for (const b of p.disallowedBlocks) {
      flaggedTypes.set(b.type, (flaggedTypes.get(b.type) ?? 0) + 1)
    }
    console.log(
      `  • ${p.title} (id=${p.resourceId}, ${contentBlocks.length} blocks)${flagStr}`,
    )
  }

  if (flaggedTypes.size > 0) {
    console.log(
      `\n⚠  Article layout does not list these as allowed editor blocks:`,
    )
    for (const [t, n] of flaggedTypes) console.log(`     - ${t}: ${n}`)
    console.log(
      "   The blocks will be preserved in the blob — they will continue to render —",
    )
    console.log(
      "   but editors will not be able to add new blocks of these types via the Studio UI.",
    )
  }
}

// ---------------------------------------------------------------------------
// Prompt validators
// ---------------------------------------------------------------------------

export const validateNumericId = (label: string) => (v: string) =>
  /^\d+$/.test(v.trim()) || `${label} must be a numeric string`
