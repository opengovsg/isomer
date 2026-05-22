/**
 * Workflow 1 of 2 — Export a Folder→Collection conversion plan to local files.
 *
 * Does NOT mutate the database. Pulls the folder + all direct children,
 * computes new blobs in memory, writes:
 *   - .out/convert-folder-<id>-<ts>.json        (full plan, machine-readable)
 *   - .out/convert-folder-<id>-<ts>.report.md   (human-readable report,
 *                                                lists incompatible blocks)
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/convert-folder-to-collection/exportConversionPlan.ts
 *
 * Once the report has been reviewed, run applyConversionPlan.ts to write the
 * draft blobs back to the database.
 */

import { input } from "@inquirer/prompts"
import { db, ResourceType } from "~/server/modules/database"
import { getBlobOfResource } from "~/server/modules/resource/resource.service"

import {
  asContentBlob,
  asIndexBlob,
  buildArticleBlob,
  buildCollectionIndexBlob,
  findDisallowedBlocks,
  type ConversionPlan,
  type PagePlan,
} from "./helpers"
import {
  printPlan,
  validateNumericId,
  verifyFolder,
  verifySite,
  writePlanFile,
  writeReportFile,
} from "./shared"

const loadChildren = async (folderId: string) =>
  db
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
  if (!indexPage) throw new Error("Index page missing after guard check")

  const indexBlob = await getBlobOfResource({ db, resourceId: indexPage.id })
  const indexCurrent = asIndexBlob(indexBlob.content)
  const indexPagePlan: PagePlan = {
    resourceId: indexPage.id,
    title: indexPage.title,
    permalink: indexPage.permalink,
    currentBlobId: indexBlob.id,
    currentBlob: indexBlob.content,
    nextBlob: buildCollectionIndexBlob(indexCurrent, folder.title),
    disallowedBlocks: [],
  }

  const pagePlans: PagePlan[] = []
  for (const child of pages) {
    const blob = await getBlobOfResource({ db, resourceId: child.id })
    const current = asContentBlob(blob.content)
    pagePlans.push({
      resourceId: child.id,
      title: child.title,
      permalink: child.permalink,
      currentBlobId: blob.id,
      currentBlob: blob.content,
      nextBlob: buildArticleBlob(current, defaultCategory),
      disallowedBlocks: findDisallowedBlocks(current.content),
    })
  }

  return {
    folder,
    indexPage: indexPagePlan,
    pages: pagePlans,
    defaultCategory,
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
    message: "Default category to apply to ALL converted articles",
    default: "Feature Articles",
  })

  const plan = await buildConversionPlan(
    {
      id: folder.id,
      siteId: folder.siteId,
      title: folder.title,
      permalink: folder.permalink,
    },
    defaultCategory,
  )

  printPlan(plan)

  const jsonPath = writePlanFile(plan)
  const reportPath = writeReportFile(plan, jsonPath)
  console.log(`\nPlan written to:   ${jsonPath}`)
  console.log(`Report written to: ${reportPath}`)
  console.log(
    `\nNext step: review the report, then run applyConversionPlan.ts to write back to DB.`,
  )
}

try {
  await main()
} catch (err) {
  console.error("\n✗ Export failed:", err)
  process.exitCode = 1
} finally {
  await db.destroy()
}
