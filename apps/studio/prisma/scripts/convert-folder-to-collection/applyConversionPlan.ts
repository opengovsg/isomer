/**
 * Workflow 2 of 2 — Apply a previously-exported conversion plan to the DB.
 *
 * Prerequisites: run exportConversionPlan.ts first to produce a .out/*.json
 * plan, then review the accompanying .report.md.
 *
 * This script:
 *   1. Prompts for site ID + folder ID and verifies both exist in the DB.
 *   2. Prompts for the plan file path (defaulting to the most recent export
 *      for this folder).
 *   3. Cross-checks that the plan's folder.id and folder.siteId match the
 *      values just verified.
 *   4. Writes the converted blobs as draft blobs (overwriting any existing
 *      draft) and flips Resource.type (Folder→Collection, Page→CollectionPage)
 *      in a single transaction.
 *   5. Optionally mass-publishes all converted resources (one site rebuild
 *      at the end).
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/convert-folder-to-collection/applyConversionPlan.ts
 */

import { confirm, input } from "@inquirer/prompts"
import { createBaseLogger } from "~/lib/logger"
import { publishSite } from "~/server/modules/aws/codebuild.service"
import { db, ResourceState, ResourceType } from "~/server/modules/database"
import { updateBlobById } from "~/server/modules/resource/resource.service"
import { incrementVersion } from "~/server/modules/version/version.service"

import type { ConversionPlan } from "./helpers"
import {
  findLatestPlanForFolder,
  printPlan,
  readPlanFile,
  validateNumericId,
  verifyFolder,
  verifySite,
  verifyUser,
} from "./shared"

const logger = createBaseLogger({
  path: "prisma/scripts/convert-folder-to-collection",
})

const applyConversion = async (plan: ConversionPlan) => {
  await db.transaction().execute(async (tx) => {
    await tx
      .updateTable("Resource")
      .set({ type: ResourceType.Collection })
      .where("id", "=", plan.folder.id)
      .execute()

    await updateBlobById(tx, {
      pageId: Number(plan.indexPage.resourceId),
      siteId: plan.folder.siteId,
      content: plan.indexPage.nextBlob,
    })
    await tx
      .updateTable("Resource")
      .set({ state: ResourceState.Draft })
      .where("id", "=", plan.indexPage.resourceId)
      .execute()

    for (const p of plan.pages) {
      await updateBlobById(tx, {
        pageId: Number(p.resourceId),
        siteId: plan.folder.siteId,
        content: p.nextBlob,
      })
      await tx
        .updateTable("Resource")
        .set({ type: ResourceType.CollectionPage, state: ResourceState.Draft })
        .where("id", "=", p.resourceId)
        .execute()
    }
  })

  console.log(
    `\n✓ Wrote draft blobs and flipped types for ${plan.pages.length + 1} resources (Folder + IndexPage + ${plan.pages.length} pages).`,
  )
}

const massPublish = async (plan: ConversionPlan, userId: string) => {
  await verifyUser(userId)

  const allResourceIds = [
    plan.indexPage.resourceId,
    ...plan.pages.map((p) => p.resourceId),
  ]

  await db.transaction().execute(async (tx) => {
    for (const resourceId of allResourceIds) {
      const result = await incrementVersion({
        tx,
        siteId: plan.folder.siteId,
        resourceId,
        userId,
      })
      if (!result) {
        console.log(`  - ${resourceId}: no draft (already published) — skipped`)
      } else {
        console.log(
          `  - ${resourceId}: published v${result.newVersion.versionNum}`,
        )
      }
    }
  })

  console.log("\nTriggering site rebuild…")
  await publishSite(logger, { siteId: plan.folder.siteId })
  console.log("✓ publishSite() invoked")
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
  await verifyFolder(folderId.trim(), siteId)

  const suggestedPath = findLatestPlanForFolder(folderId.trim())
  const planPath = await input({
    message: "Path to the conversion plan JSON",
    default: suggestedPath,
    validate: (v) => v.trim().length > 0 || "Plan path is required",
  })

  const plan = readPlanFile(planPath.trim())

  if (plan.folder.id !== folderId.trim()) {
    throw new Error(
      `Plan folder.id (${plan.folder.id}) does not match prompted folder ID (${folderId.trim()}). Refusing to apply.`,
    )
  }
  if (plan.folder.siteId !== siteId) {
    throw new Error(
      `Plan folder.siteId (${plan.folder.siteId}) does not match prompted site ID (${siteId}). Refusing to apply.`,
    )
  }

  printPlan(plan)

  const proceed = await confirm({
    message: "Apply these changes as draft blobs (overwrites existing drafts)?",
    default: false,
  })
  if (!proceed) {
    console.log("Aborted. No changes written.")
    return
  }

  await applyConversion(plan)

  const publish = await confirm({
    message: "Mass-publish all converted resources now?",
    default: false,
  })
  if (!publish) {
    console.log("Done. Drafts left for review in Studio.")
    return
  }

  const userId = await input({
    message: "User ID to record as publisher",
    validate: (v) => v.trim().length > 0 || "User ID is required",
  })

  await massPublish(plan, userId.trim())
}

try {
  await main()
} catch (err) {
  console.error("\n✗ Apply failed:", err)
  process.exitCode = 1
} finally {
  await db.destroy()
}
