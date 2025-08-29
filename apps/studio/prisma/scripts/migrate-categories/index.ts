// NOTE: This migration should only be ran after the `addCollectionIndexPage` migration
// and the addition of the `tags` property to the `IndexPage` in `collection-tags`
import { randomUUID, UUID } from "crypto"
import { Transaction } from "kysely"

import { DB, db, jsonb, SafeKysely, sql } from "~/server/modules/database"
import { updateBlobById } from "~/server/modules/resource/resource.service"
import { TagCategory } from "../collection-tags/"

// NOTE: we need to get all pages + indexpage
// under a category.
// The pages are required for the set of all categories
// and we need to write the set to the index page
// as a new `TagCategory`
const getAllCollectionsOfSite = async (db: SafeKysely, siteId: number) => {
  const collections = await db
    .selectFrom("Resource")
    .where("siteId", "=", siteId)
    .where("type", "=", "Collection")
    .selectAll()
    .execute()
  return collections
}

// NOTE: for categories, they exist on the collection links
const migrateCollection = async (db: Transaction<DB>, collectionId: string) => {
  // NOTE: Migration consists of a few steps.
  // Step 1: Grab all potential items containing categories
  // NOTE: No `IndexPages` from collections have 'category'
  // the below query shows that all the results are `null`
  //  `SELECT
  // 	"db"."content" -> 'page' -> 'category' AS "db",
  // 	"pb"."content" -> 'page' -> 'category' AS "pb"
  // FROM
  // 	"Resource"
  // 	LEFT JOIN "Version" ON "Resource"."publishedVersionId" = "Version"."id"
  // 	LEFT JOIN "Blob" AS "pb" ON "Version"."blobId" = "pb"."id"
  // 	LEFT JOIN "Blob" AS "db" ON "db"."id" = "Resource"."draftBlobId"
  // WHERE
  // 	"parentId" IN (
  // 		SELECT
  // 			"id"
  // 		FROM
  // 			"Resource"
  // 		WHERE
  // 			"type" = 'Collection'
  // 	)
  // 	AND "type" = 'IndexPage';`
  const pages = await db
    .selectFrom("Resource")
    .where("type", "in", ["CollectionPage", "CollectionLink"])
    .where((eb) =>
      eb.or([
        eb(sql`"draftBlob"."content" -> 'page' -> 'category'`, "is not", null),
        eb(
          sql`"publishedBlob"."content" -> 'page' -> 'category'`,
          "is not",
          null,
        ),
      ]),
    )
    .where("parentId", "=", collectionId)
    .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
    .leftJoin("Blob as draftBlob", "draftBlob.id", "Resource.draftBlobId")
    .leftJoin("Blob as publishedBlob", "publishedBlob.id", "Version.blobId")
    .select((eb) => {
      return [
        "Resource.id",
        eb.fn
          // NOTE: select draft blob preferentially
          .coalesce(
            sql<string>`"draftBlob"."content" -> 'page' -> 'category'`,
            sql<string>`"publishedBlob"."content" -> 'page' -> 'category'`,
          )
          .as("category"),
        eb.fn
          // NOTE: select draft blob preferentially
          .coalesce(
            sql<PrismaJson.BlobJsonContent>`"draftBlob"."content"`,
            sql<PrismaJson.BlobJsonContent>`"publishedBlob"."content"`,
          )
          .as("content"),
        // NOTE: can update `draftBlobId` (if it exists) directly
        // but we need to create a new `draftBlob` if `draftBlobId`
        // doesn't exist
        "blobId",
        "draftBlobId",
      ]
    })
    .execute()

  // NOTE: Step 2: create a mapping of the `label` (existing tag) to the `uuid` that we'll generate now
  const labelSet = new Set(pages.map(({ category }) => category))
  const labels = [...labelSet]
  const labelToId: Record<string, UUID> = Object.fromEntries(
    labels.map((label) => [label, randomUUID()]),
  )

  // NOTE: Step 3: write the new categories to the index page
  const tagCategory: TagCategory = {
    id: randomUUID(),
    label: "Category",
    options: Object.entries(labelToId).map(([label, id]) => {
      return { label, id }
    }),
  }

  const indexPage = await db
    .selectFrom("Resource")
    .where("type", "=", "IndexPage")
    .where("parentId", "=", collectionId)
    .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
    .leftJoin("Blob as draftBlob", "draftBlob.id", "Resource.draftBlobId")
    .leftJoin("Blob as publishedBlob", "publishedBlob.id", "Version.blobId")
    // NOTE: assumption - every collection has an index page
    // we should always run the other migration `addCollectionIndexPage` first
    .select((eb) => {
      return [
        "Resource.siteId",
        "Resource.id",
        eb.fn
          // NOTE: select draft blob preferentially
          .coalesce(
            sql<PrismaJson.BlobJsonContent>`"draftBlob"."content"`,
            sql<PrismaJson.BlobJsonContent>`"publishedBlob"."content"`,
          )
          .as("content"),
        "publishedBlob.content as publishedContent",
        "publishedBlob.id as blobId",
        // NOTE: can update `draftBlobId` (if it exists) directly
      ]
    })
    .executeTakeFirstOrThrow()

  // NOTE: no need to update if no categories (required because there are collection pages without categories)
  if (labels.length > 0) {
    // NOTE: need to update the published index page directly
    if (indexPage.publishedContent) {
      // The actual typing change is not in this PR, which results in an error
      // @ts-ignore
      const existingPublishedTags = indexPage.publishedContent.page.tags ?? []

      await db
        .updateTable("Blob")
        .where("id", "=", indexPage.blobId)
        .set({
          content: jsonb({
            ...indexPage.publishedContent,
            page: {
              ...indexPage.publishedContent.page,
              // NOTE: we need this ignore because the `tags` property doesn't exist on the index page yet
              // but we've already added it in our previous migration.
              // The actual typing change is not in this PR, which results in an error
              // @ts-ignore
              tags: [...existingPublishedTags, tagCategory],
            },
          }),
        })
        .execute()
    } else {
      // @ts-ignore
      const existingTags = indexPage.content.page.tags ?? []

      await updateBlobById(db, {
        pageId: Number(indexPage.id),
        siteId: indexPage.siteId,
        content: {
          ...indexPage.content,
          page: {
            ...indexPage.content.page,
            // NOTE: we need this ignore because the `tags` property doesn't exist on the index page yet
            // but we've already added it in our previous migration.
            // The actual typing change is not in this PR, which results in an error
            // @ts-ignore
            tags: [...existingTags, tagCategory],
          },
        },
      })
    }
  }

  // NOTE: Step 4: write the new id to the individual pages and links
  for (const data of pages) {
    const { category, id: resourceId, content, blobId } = data
    const categoryId = labelToId[category]
    if (!categoryId) {
      console.error(
        `expected uuid for page with id: ${resourceId} but found no uuid for category: ${category}`,
      )
      continue
    } else {
      // The actual typing change is not in this PR, which results in an error
      // @ts-ignore
      const existingTags = content.page.tagged ?? []
      const updatedContent = {
        ...content,
        page: {
          ...content.page,
          // NOTE: assumption is that this is the last PR in the chain, which means that we need
          // to preserve the prior `tagged` which we added.
          // The `uuid` is guaranteed to exist due to our earlier check
          tagged: [...existingTags, categoryId],
        },
      }

      await updateBlobById(db, {
        pageId: Number(resourceId),
        siteId: indexPage.siteId,
        content: updatedContent,
      })

      // NOTE: need to update the last published version also
      // to ensure that we also have a consistent state
      const lastPublishedBlob = await db
        .selectFrom("Blob")
        .select("content")
        .where("id", "=", blobId)
        .executeTakeFirst()

      if (!lastPublishedBlob) {
        console.error(
          `expected blob with id: ${blobId} for page with id: ${resourceId} but found no blob`,
        )
        continue
      }

      // NOTE: this update is conditional and we might not have anything
      // if there were no `tags` on the page previously
      // @ts-ignore
      const previousTagged = lastPublishedBlob.content.page.tagged ?? []
      const newContent = {
        ...lastPublishedBlob.content,
        page: {
          ...lastPublishedBlob.content.page,
          // NOTE: assumption is that this is the last PR in the chain, which means that we need
          // to preserve the prior `tagged` which we added.
          // The `uuid` is guaranteed to exist due to our earlier check
          // The actual typing change is not in this PR, which results in an error
          // @ts-ignore
          tagged: [...previousTagged, categoryId],
        },
      }

      await db
        .updateTable("Blob")
        // NOTE: This works because a page has a 1-1 relation with a blob
        .set({ content: jsonb(newContent) })
        .where("Blob.id", "=", blobId)
        .returningAll()
        .executeTakeFirstOrThrow()
    }
  }
}

export const up = async () => {
  const sites = await db.selectFrom("Site").select("id").execute()
  // NOTE: Do on a site level so we can failover cleanly
  // as this change is back-compat,
  // so we can always rerun
  for (const site of sites) {
    const collections = await getAllCollectionsOfSite(db, site.id)
    for (const collection of collections) {
      await db.transaction().execute(async (tx) => {
        await migrateCollection(tx, collection.id)
      })
    }
  }
}

// await up()
