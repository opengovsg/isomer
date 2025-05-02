import type { Kysely } from "~/server/modules/database/types"
import { jsonb } from "~/server/modules/database/utils"

export const updateNavbarToIncludeCallToAction = async (db: Kysely<any>) => {
  try {
    // Fetch all navbar records outside the main update transaction
    const navbars = await db.selectFrom("Navbar").selectAll().execute()

    await db.transaction().execute(async (trx) => {
      for (const navbar of navbars) {
        const originalContent = navbar.content

        if (!originalContent) {
          continue
        }

        // Clone the original navbar object for the 'before' state in audit log
        const originalNavbarClone = structuredClone(navbar)

        const newContentValue =
          originalContent &&
          typeof originalContent === "object" &&
          "items" in originalContent
            ? originalContent
            : { items: originalContent }

        const hasChanged =
          JSON.stringify(newContentValue) !==
          JSON.stringify(originalNavbarClone.content)

        if (hasChanged) {
          await trx
            .updateTable("Navbar")
            .set({ content: jsonb(newContentValue) })
            .where("id", "=", navbar.id)
            .execute()

          console.log(
            `Updated Navbar record ID: ${navbar.id} within transaction.`,
          )
        } else {
          console.log(
            `Skipped Navbar record ID: ${navbar.id} - already in new format or content is null/undefined`,
          )
        }
      }
    })
  } catch (error) {
    console.error("Transaction failed:", error)
    console.log("All changes have been rolled back.")
    throw error
  }
}

// Uncomment to run the migration
// updateNavbarToIncludeCallToAction()
