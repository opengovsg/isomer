import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import {
  COLLECTION_PAGE_DEFAULT_SORT_BY,
  COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import _ from "lodash"

import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { createBaseLogger } from "~/lib/logger"
import { publishSite } from "~/server/modules/aws/codebuild.service"
import {
  db,
  jsonb,
  ResourceState,
  ResourceType,
} from "~/server/modules/database"
import { PG_ERROR_CODES } from "~/server/modules/database/constants"

export const up = async () => {
  const collectionsWithoutIndexPages = await db
    .selectFrom("Resource as p")
    .leftJoin("Resource as c", (join) =>
      join
        .onRef("p.id", "=", "c.parentId")
        .on("c.type", "=", "IndexPage")
        .on("p.type", "=", "Collection"),
    )
    .selectAll("p")
    .where("c.parentId", "is", null)
    .where("p.type", "=", ResourceType.Collection)
    .execute()

  console.log(
    `Found ${collectionsWithoutIndexPages.length} collections without index pages`,
  )

  for (const collection of collectionsWithoutIndexPages) {
    if (collection.type != ResourceType.Collection) {
      throw new Error(
        `invalid type: ${collection.type}, resource: ${collection.id}`,
      )
    }
    console.log(`Adding index page to collection with id: ${collection.id}`)
    // NOTE: should only have 47 rows requiring this migration
    const blobContent = {
      layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
      page: {
        title: collection.title,
        subtitle: `Read more on ${collection.title.toLowerCase()} here.`,
        defaultSortBy: COLLECTION_PAGE_DEFAULT_SORT_BY,
        defaultSortDirection: COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
      } as CollectionPagePageProps,
      content: [],
      version: "0.1.0",
    }

    await db.transaction().execute(async (tx) => {
      const blob = await tx
        .insertInto("Blob")
        .values({ content: jsonb(blobContent) })
        .returning("Blob.id")
        .executeTakeFirstOrThrow()

      const addedResource = await tx
        .insertInto("Resource")
        .values({
          title: collection.title,
          permalink: INDEX_PAGE_PERMALINK,
          siteId: collection.siteId,
          parentId: collection.id,
          draftBlobId: blob.id,
          type: ResourceType.IndexPage,
          state: ResourceState.Draft,
        })
        .returningAll()
        .executeTakeFirstOrThrow()
        .catch((err) => {
          if (_.get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A resource with the same permalink already exists",
            })
          }
          throw err
        })

      console.log(`Added index page with id: ${addedResource.id}`)
    })
  }
}

// await up()
