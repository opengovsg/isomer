/**
 * Workflow 2 of 2 — Apply a previously-exported conversion plan to the DB.
 *
 * Prerequisites: run exportConversionPlan.ts first to produce a .out/*.json
 * plan, then review the accompanying .report.json.
 *
 * This script:
 *   1. Prompts for site ID + folder ID and verifies both exist in the DB.
 *   2. Prompts for the folder plan JSON path (defaulting to the export for
 *      this folder, if one exists). Loads the companion resource JSON files
 *      from .out/.
 *   3. Cross-checks that the plan's folder.id and folder.siteId match the
 *      values just verified.
 *   4. Writes the converted blobs as draft blobs (overwriting any existing
 *      draft) and flips Resource.type (Folder→Collection, Page→CollectionPage)
 *      in a single transaction.
 *   5. Optionally mass-publishes all converted resources (reminds you to
 *      trigger a site rebuild in Studio for changes to go live).
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/convert-folder-to-collection/applyConversionPlan.ts
 */

import { confirm, input } from "@inquirer/prompts"
import { db } from "~/server/modules/database/database"
import { ResourceState, ResourceType } from "~/server/modules/database/types"

import type { ConversionPlan } from "./helpers"
import {
  findPlanForFolder,
  incrementVersion,
  printPlan,
  loadConversionPlanFromPath,
  updateBlobById,
  validateNumericId,
  verifyFolder,
  verifySite,
  verifyUser,
} from "./shared"

const applyConversion = async (plan: ConversionPlan) => {
  await db.transaction().execute(async (tx) => {
    await tx
      .updateTable("Resource")
      .set({ type: ResourceType.Collection })
      .where("id", "=", plan.folder.id)
      .execute()

    await updateBlobById(tx, {
      content: plan.indexPage.nextBlob,
      pageId: Number(plan.indexPage.resourceId),
      siteId: plan.folder.siteId,
    })
    await tx
      .updateTable("Resource")
      .set({ state: ResourceState.Draft })
      .where("id", "=", plan.indexPage.resourceId)
      .execute()

    for (const p of plan.pages) {
      await updateBlobById(tx, {
        content: p.nextBlob,
        pageId: Number(p.resourceId),
        siteId: plan.folder.siteId,
      })
      await tx
        .updateTable("Resource")
        .set({ state: ResourceState.Draft, type: ResourceType.CollectionPage })
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
    await Promise.all(
      allResourceIds.map(async (resourceId) => {
        const result = await incrementVersion({
          resourceId,
          siteId: plan.folder.siteId,
          tx,
          userId,
        })
        if (result) {
          console.log(
            `  - ${resourceId}: published v${result.newVersion.versionNum}`,
          )
        } else {
          console.log(
            `  - ${resourceId}: no draft (already published) — skipped`,
          )
        }
      }),
    )
  })

  console.log(
    "\nReminder: trigger a new site build in Studio for these changes to appear on the live site.",
  )
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

  const suggestedPath = findPlanForFolder(folderId.trim())
  const planPath = await input({
    default: suggestedPath,
    message: "Path to the folder conversion plan JSON",
    validate: (v) => v.trim().length > 0 || "Plan path is required",
  })

  const plan = loadConversionPlanFromPath(planPath.trim())

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
    default: false,
    message: "Apply these changes as draft blobs (overwrites existing drafts)?",
  })
  if (!proceed) {
    console.log("Aborted. No changes written.")
    return
  }

  await applyConversion(plan)

  const publish = await confirm({
    default: false,
    message: "Mass-publish all converted resources now?",
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
} catch (error) {
  console.error("\n✗ Apply failed:", error)
  process.exitCode = 1
} finally {
  await db.destroy()
}
