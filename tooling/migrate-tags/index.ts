import type { LegacyTag } from "utils"
import _ from "lodash"

import { db, jsonb } from "../../apps/studio/src/server/modules/database"
import {
  getBlobOfResource,
  updateBlobById,
} from "../../apps/studio/src/server/modules/resource/resource.service"
import {
  generateUpdatedContent,
  getChildItemsWithTags,
  getCollatedTags,
  getCollectionsOfSiteWithTags,
  migrateTags,
} from "./utils"

export const migrateTagsOfSite = async (siteId: number) => {
  const collectionIds = await getCollectionsOfSiteWithTags(siteId)
  const publisher = !!process.env.PUBLISHER_USER_ID
    ? { id: process.env.PUBLISHER_USER_ID }
    : await db
        .selectFrom("User")
        .where("email", "=", "jiachin@open.gov.sg")
        .select("id")
        .executeTakeFirstOrThrow()

  for (const { id } of collectionIds) {
    console.log(`Updating collection: ${id}`)
    if (!id) return
    const { title } = await db
      .selectFrom("Resource")
      .where("id", "=", id)
      .select("title")
      .executeTakeFirstOrThrow()

    // NOTE: guaranteed non-null since we selected as `parentId` for pages explicitly
    const resourcesWithTags = await getChildItemsWithTags(id)

    const collatedTags = await getCollatedTags(resourcesWithTags)

    const { labelToCategoryToId, tagCategories } = migrateTags(collatedTags)
    const indexPage = await db
      .selectFrom("Resource")
      .where("type", "=", "IndexPage")
      .where("parentId", "=", id)
      .selectAll()
      .executeTakeFirstOrThrow()

    // NOTE: we need to do 2 things in this `tx`
    // Step 1: write to the index page with the newly generated tags
    // Step 2: write the updated mappings to each individual page
    await db.transaction().execute(async (tx) => {
      console.log(`Updating the draft blob of index page: ${indexPage.id}`)
      const indexPageBlob = await getBlobOfResource({
        db: tx,
        resourceId: indexPage.id,
      })

      await updateBlobById(tx, {
        pageId: Number(indexPage.id),
        siteId: indexPage.siteId,
        content: {
          ...indexPageBlob.content,
          page: { ...indexPageBlob.content.page, tagCategories },
        },
      })

      if (indexPage.publishedVersionId) {
        console.log(`Updating the published blob of index: ${indexPage.id}`)

        const publishedContent = await tx
          .selectFrom("Version")
          .where("id", "=", indexPage.publishedVersionId)
          .selectAll()
          .executeTakeFirst()

        if (publishedContent) {
          const publishedBlob = await tx
            .selectFrom("Blob")
            .selectAll()
            .where("id", "=", publishedContent.blobId)
            .executeTakeFirstOrThrow()

          await tx
            .updateTable("Blob")
            .set({
              content: jsonb({
                ...publishedBlob.content,
                page: {
                  ...publishedBlob.content.page,
                  tagCategories,
                },
              }),
            })
            .where("id", "=", publishedBlob.id)
            .execute()
        }
      } else {
        // NOTE: if we're lacking a published version, we will use a default collection page
        console.log(
          `Creating a default published blob for index: ${indexPage.id}`,
        )

        const content = {
          ...indexPageBlob.content,
          page: {
            ...indexPageBlob.content.page,
            tagCategories,
            subtitle: `Pages in ${title}`,
          },
        }

        const publishedBlob = await tx
          .insertInto("Blob")
          .values({ content: jsonb(content) })
          .returningAll()
          .executeTakeFirstOrThrow()

        const version = await tx
          .insertInto("Version")
          .values({
            resourceId: indexPage.id,
            blobId: publishedBlob.id,
            versionNum: 1,
            publishedBy: publisher.id,
          })
          .returningAll()
          .executeTakeFirstOrThrow()

        await tx
          .updateTable("Resource")
          .set({
            publishedVersionId: version.id,
            state: "Published",
          })
          .where("id", "=", indexPage.id)
          .execute()
      }

      for (const resource of resourcesWithTags) {
        const draftBlob = resource.content
        const tagsOfResource =
          ((resource.content.page as any).tags as LegacyTag[]) ?? []
        // NOTE: we only update the `page.tags` here
        // since the rest of the content is not changed
        const updatedDraftBlobContent = generateUpdatedContent(
          draftBlob,
          tagsOfResource,
          labelToCategoryToId,
        )

        console.log(
          `Updating the draft blob of collection item: ${resource.id}`,
        )
        await updateBlobById(tx, {
          pageId: Number(resource.id),
          siteId: indexPage.siteId,
          content: updatedDraftBlobContent,
        })

        // NOTE: update the published blob
        // using the same logic and the same uuid
        if (resource.requiresPublish) {
          const publishedBlob = resource.publishedBlobContent
          if (!publishedBlob) continue

          const updatedPublishedBlobContent = generateUpdatedContent(
            publishedBlob,
            tagsOfResource,
            labelToCategoryToId,
          )

          // NOTE: cannot use `updateBlobById` here
          console.log(
            `Updating the published blob of collection item: ${resource.id}`,
          )
          await tx
            .updateTable("Blob")
            // NOTE: This works because a page has a 1-1 relation with a blob
            .set({ content: jsonb(updatedPublishedBlobContent) })
            .where("Blob.id", "=", resource.blobId)
            .returningAll()
            .executeTakeFirstOrThrow()
        }
      }
    })

    console.log(`Update completed for collection ${id}`)
  }
}
