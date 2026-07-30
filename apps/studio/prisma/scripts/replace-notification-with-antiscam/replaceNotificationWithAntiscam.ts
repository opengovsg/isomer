/**
 * Replace active site notification banners with the standard anti-scam variant.
 *
 * Only sites with an active notification are updated. Sites already using
 * `{ type: "antiscam" }` are skipped. Sites without a notification are untouched.
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/replace-notification-with-antiscam/replaceNotificationWithAntiscam.ts --dry-run
 *   source .env && pnpm exec tsx prisma/scripts/replace-notification-with-antiscam/replaceNotificationWithAntiscam.ts
 *   source .env && pnpm exec tsx prisma/scripts/replace-notification-with-antiscam/replaceNotificationWithAntiscam.ts --site-id 42
 */

import { input } from "@inquirer/prompts"
import { db } from "~/server/modules/database"

import {
  parseArgs,
  replaceNotificationWithAntiscam,
  resolveScriptUserIdByEmail,
} from "./shared"

const main = async () => {
  const { dryRun, siteId } = parseArgs()

  const scriptUserId = dryRun
    ? ""
    : await resolveScriptUserIdByEmail(
        await input({
          message: "Enter your email address (e.g. adriangoh@open.gov.sg)",
          validate: (value) => value.trim().length > 0 || "Email is required",
        }),
      )

  await replaceNotificationWithAntiscam({
    dryRun,
    siteId,
    scriptUserId,
  })
}

try {
  await main()
} catch (err) {
  console.error("\n✗ Migration failed:", err)
  process.exitCode = 1
} finally {
  await db.destroy()
}
