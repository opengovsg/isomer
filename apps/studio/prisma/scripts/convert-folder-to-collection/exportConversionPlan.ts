/**
 * Workflow 1 of 2 — Export a Folder→Collection conversion plan to local files.
 *
 * Does NOT mutate the database. Pulls the folder + all direct children,
 * computes new blobs in memory, writes:
 *   - .out/convert-folder-<id>.json              (folder metadata + resource IDs)
 *   - .out/convert-resource-<id>.json            (one per index page + child page)
 *   - .out/convert-folder-<id>.report.json       ([{ id, reason }] for flagged pages)
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/convert-folder-to-collection/exportConversionPlan.ts
 *
 * Once the report has been reviewed, run applyConversionPlan.ts to write the
 * draft blobs back to the database.
 */

import { input } from "@inquirer/prompts"
import { db } from "~/server/modules/database/database"
import { ResourceType } from "~/server/modules/database/types"

import { asIndexBlob, asPageBlob, buildArticleBlob, buildCollectionIndexBlob, findDisallowedBlocks } from './helpers';
import type { ConversionPlan, PagePlan } from './helpers';
import {
  getBlobOfResource,
  printPlan,
  validateNumericId,
  verifyFolder,
  verifySite,
  writePlanFiles,
  writeReportFile,
} from "./shared"

const loadChildren = async (folderId: string) =>
  await db
    .selectFrom("Resource")
    .where("parentId", "=", folderId)
    .select(["id", "title", "permalink", "type", "state", "draftBlobId"])
    .execute()

const buildConversionPlan = async (
  folder: { id: string; siteId: number; title: string; permalink: string },
  defaultCategory: string,
): Promise<ConversionPlan> => {
  const children = await loadChildren(folder.id)

  const indexPages = children.filter((c) => c.type === ResourceType.IndexPage)
  const pages = children.filter((c) => c.type === ResourceType.Page)
  const unexpected = children.filter(
    (c) =>
      c.type !== ResourceType.IndexPage &&
      c.type !== ResourceType.Page &&
      c.type !== ResourceType.FolderMeta,
  )

  if (indexPages.length !== 1) {
    throw new Error(
      `Expected exactly 1 IndexPage child, found ${indexPages.length}`,
    )
  }
  if (unexpected.length > 0) {
    throw new Error(
      `Folder contains unsupported child types: ${unexpected
        .map((c) => `${c.id} (${c.type})`)
        .join(", ")}. Aborting — nested folders/collections are not supported.`,
    )
  }

  const [indexPage] = indexPages
  if (!indexPage) {throw new Error("Index page missing after guard check")}

  const indexBlob = await getBlobOfResource({ db, resourceId: indexPage.id })
  const indexCurrent = asIndexBlob(indexBlob.content)
  const indexPagePlan: PagePlan = {
    currentBlob: indexBlob.content,
    currentBlobId: indexBlob.id,
    disallowedBlocks: [],
    nextBlob: buildCollectionIndexBlob(indexCurrent, folder.title),
    permalink: indexPage.permalink,
    resourceId: indexPage.id,
    title: indexPage.title,
  }

  const pagePlans: PagePlan[] = await Promise.all(
    pages.map(async (child) => {
      const blob = await getBlobOfResource({ db, resourceId: child.id })
      const current = asPageBlob(blob.content)
      return {
        currentBlob: blob.content,
        currentBlobId: blob.id,
        disallowedBlocks: findDisallowedBlocks(current.content),
        nextBlob: buildArticleBlob(current, defaultCategory),
        permalink: child.permalink,
        resourceId: child.id,
        title: child.title,
      }
    }),
  )

  return {
    defaultCategory,
    folder,
    indexPage: indexPagePlan,
    pages: pagePlans,
  }
}

const main = async () => {
  console.log(`Connecting via DATABASE_URL…`)

  const siteIdStr = await input({
    message: "Site ID",
    validate: validateNumericId("Site ID"),
  })
  const siteId = Number(siteIdStr.trim())
  await verifySite(siteId)

  const folderId = await input({
    message: "Resource ID of the Folder to convert",
    validate: validateNumericId("Folder ID"),
  })
  const folder = await verifyFolder(folderId.trim(), siteId)

  const defaultCategory = await input({
    default: "Feature Articles",
    message: "Default category to apply to ALL converted articles",
  })

  const plan = await buildConversionPlan(
    {
      id: folder.id,
      permalink: folder.permalink,
      siteId: folder.siteId,
      title: folder.title,
    },
    defaultCategory,
  )

  printPlan(plan)

  const jsonPaths = writePlanFiles(plan)
  const reportPath = writeReportFile(plan)
  console.log(`\nPlans written (${jsonPaths.length} files):`)
  for (const p of jsonPaths) {console.log(`  ${p}`)}
  console.log(`\nReport written to: ${reportPath}`)
  console.log(
    `\nNext step: review the report, then run applyConversionPlan.ts to write back to DB.`,
  )
}

try {
  await main()
} catch (error) {
  console.error("\n✗ Export failed:", error)
  process.exitCode = 1
} finally {
  await db.destroy()
}
