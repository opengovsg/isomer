/**
 * Entry point for the gazette category backfill — see
 * ./backfillGazetteCategoryTags.ts for what it does.
 *
 * Prompts for the site id, gazette collection id, and whether to dry run.
 * Run it once as a dry run to review the summary, then again to write.
 *
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/backfill-gazette-category-tags/runBackfill.ts
 *
 * See prisma/scripts/README.md for the jump-host setup. Pair with another
 * engineer when running against production.
 */

import { confirm, input } from "@inquirer/prompts"
import { db } from "~/server/modules/database"

import { backfillGazetteCategoryTags } from "./backfillGazetteCategoryTags"

const validateNumericId = (label: string) => (value: string) =>
  /^\d+$/.test(value.trim()) || `${label} must be a numeric string`

const main = async () => {
  const siteId = Number(
    await input({
      message: "Site ID",
      validate: validateNumericId("Site ID"),
    }),
  )
  const collectionId = Number(
    await input({
      message: "Gazette collection ID",
      validate: validateNumericId("Collection ID"),
    }),
  )
  // Defaults to true so an accidental Enter never writes.
  const dryRun = await confirm({
    message: "Dry run (report only, no writes)?",
    default: true,
  })

  return backfillGazetteCategoryTags({ siteId, collectionId, dryRun })
}

main()
  .then(async (unresolvableCount) => {
    await db.destroy()
    // Non-zero when rows were left behind, so a partial backfill is noticeable
    // rather than looking like a clean run.
    process.exit(unresolvableCount > 0 ? 1 : 0)
  })
  .catch(async (error: unknown) => {
    console.error(error)
    await db.destroy()
    process.exit(1)
  })
