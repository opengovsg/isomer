import { db } from "~/server/modules/database"

import { backfillBlockquoteStyleInContent } from "./helpers"

// Backfills the `style` discriminator on every blockquote stored in a Blob,
// so that existing pages stay valid against the new Blockquote schema.
//
// This script is idempotent and dry-runnable. By default it only logs what it
// would change; pass `--apply` to actually write to the database.
//
// Usage (see prisma/scripts/README.md for the jump-host setup):
//   source .env && pnpm exec tsx prisma/scripts/backfill-blockquote-style/backfillBlockquoteStyle.ts
//   source .env && pnpm exec tsx prisma/scripts/backfill-blockquote-style/backfillBlockquoteStyle.ts --apply

const DRY_RUN = !process.argv.includes("--apply")

const backfillBlockquoteStyle = async () => {
  const blobs = await db.selectFrom("Blob").select(["id", "content"]).execute()

  let updatedCount = 0

  for (const blob of blobs) {
    const { schema, changed } = backfillBlockquoteStyleInContent(blob.content)

    if (!changed) {
      continue
    }

    updatedCount++

    if (DRY_RUN) {
      console.log(`[dry-run] would update Blob ${blob.id}`)
      continue
    }

    await db
      .updateTable("Blob")
      .set({ content: schema as PrismaJson.BlobJsonContent })
      .where("id", "=", blob.id)
      .execute()

    console.log(`Updated Blob ${blob.id}`)
  }

  console.log(
    `${DRY_RUN ? "[dry-run] " : ""}${updatedCount}/${blobs.length} blobs ${
      DRY_RUN ? "would be updated" : "updated"
    }`,
  )
}

void backfillBlockquoteStyle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
