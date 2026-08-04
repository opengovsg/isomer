/**
 * Publishes a canonical index page for every Collection IndexPage that has never
 * been published, so the site build can resolve collection item categories again.
 *
 * See README.md for the why, the accepted risks, and the rollback procedure.
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/publish-collection-index-pages/publishCollectionIndexPages.ts
 */

import { confirm, input, select } from "@inquirer/prompts"
import { db } from "~/server/modules/database"

import type { Mode } from "./shared"
import {
  printSummary,
  runBackfill,
  validateOptionalNumericId,
  verifySite,
  verifyUser,
} from "./shared"

const main = async () => {
  console.log(`Connecting via DATABASE_URL…`)

  const mode = await select<Mode>({
    message: "Mode",
    choices: [
      {
        name: "dry-run — read only, writes a report to .out/",
        value: "dry-run",
      },
      { name: "apply — publish a new blob + Version per row", value: "apply" },
    ],
    default: "dry-run",
  })

  const siteIdInput = await input({
    message: "Site ID (blank = all sites)",
    validate: validateOptionalNumericId("Site ID"),
  })
  const siteId =
    siteIdInput.trim().length === 0 ? undefined : Number(siteIdInput.trim())
  if (siteId === undefined) {
    console.log(`Scoped to ALL sites`)
  } else {
    const site = await verifySite(siteId)
    console.log(`Scoped to site ${site.id} — ${site.name}`)
  }

  // Always plan first, so apply confirms against real counts rather than blind.
  const preview = await runBackfill({ mode: "dry-run", siteId })
  printSummary(preview.report)
  console.log(`\nReport: ${preview.path}`)

  if (mode === "dry-run") {
    console.log(
      `\nNo changes written. Review the report, then re-run to apply.`,
    )
    return
  }
  if (preview.report.totals.toPublish === 0) {
    console.log(`\nNothing to publish. Done.`)
    return
  }

  const publisherIdInput = await input({
    message: "User ID to record as publisher (Version.publishedBy)",
    validate: (value) => value.trim().length > 0 || "User ID is required",
  })
  const publisher = await verifyUser(publisherIdInput.trim())

  const proceed = await confirm({
    message:
      `Publish ${preview.report.totals.toPublish} index page(s) as ${publisher.email}?` +
      ` Existing draft blobs are left untouched.`,
    default: false,
  })
  if (!proceed) {
    console.log("Aborted. No changes written.")
    return
  }

  const { report, path } = await runBackfill({
    mode: "apply",
    siteId,
    publisherId: publisher.id,
  })
  printSummary(report)
  console.log(`\nReport: ${path}   <-- keep this, it holds the rollback data`)
  console.log(
    `\nReminder: trigger a site rebuild for each affected site — the categories` +
      ` and filters only reappear on the live site after a rebuild.`,
  )
}

try {
  await main()
} catch (err) {
  console.error("\n✗ Failed:", err)
  process.exitCode = 1
} finally {
  await db.destroy()
}
