import { CollectionPagePageProps } from "@opengovsg/isomer-components"

import { db, jsonb, sql } from "~/server/modules/database"
import { updateBlobById } from "~/server/modules/resource/resource.service"

const getAllIndexPagesWithTagCategories = async () => {
  const indexPagesOfCollections = await db
    .selectFrom("Resource")
    .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
    .leftJoin("Blob as draftBlob", "draftBlob.id", "Resource.draftBlobId")
    .leftJoin("Blob as publishedBlob", "publishedBlob.id", "Version.blobId")
    .select([
      "draftBlob.content as draftBlobContent",
      "publishedBlob.content as publishedBlobContent",
      // NOTE: If the published version has tags, we need to also
      // update it in place so that we don't have a long tail
      // and we can remove the outdated code
      sql<boolean>`jsonb_array_length("publishedBlob"."content" -> 'page' -> 'tagCategories') > 0`.as(
        "requiresPublish",
      ),
      "Resource.id",
      "Resource.siteId",
      // NOTE: can update `draftBlobId` (if it exists) directly
      // but we need to create a new `draftBlob` if `draftBlobId`
      // doesn't exist
      "blobId as publishedBlobId",
      "draftBlobId",
    ])
    .where("type", "=", "IndexPage")
    .where("parentId", "in", (eb) =>
      eb.selectFrom("Resource").where("type", "=", "Collection").select("id"),
    )
    .where((eb) =>
      eb.or([
        sql<boolean>`jsonb_array_length("draftBlob"."content" -> 'page' -> 'tagCategories') > 0`,
        sql<boolean>`jsonb_array_length("publishedBlob"."content" -> 'page' -> 'tagCategories') > 0`,
      ]),
    )
    .execute()

  return indexPagesOfCollections
}

export const up = async () => {
  const indexPages = await getAllIndexPagesWithTagCategories()
  await db.transaction().execute(async (tx) => {
    for (const indexPage of indexPages) {
      if (indexPage.requiresPublish && indexPage.publishedBlobContent) {
        const updatedContent = getUpdatedContent(indexPage.publishedBlobContent)
        await tx
          .updateTable("Blob")
          .set({
            content: jsonb(updatedContent),
          })
          .where("id", "=", indexPage.publishedBlobId)
          .execute()
      }

      if (indexPage.draftBlobContent) {
        const updatedContent = getUpdatedContent(indexPage.draftBlobContent)
        await updateBlobById(tx, {
          siteId: indexPage.siteId,
          content: updatedContent,
          pageId: Number(indexPage.id),
        })
      }
    }
  })
}

const getUpdatedContent = (content: PrismaJson.BlobJsonContent) => {
  // NOTE: do this cast because we know that it's an index page for sure
  // due to the query where we specified the type
  const indexPagePageContent = content.page as CollectionPagePageProps
  const updatedContent = {
    ...content,
    page: {
      ...indexPagePageContent,
      tagCategories: indexPagePageContent.tagCategories
        ?.sort(sortFn)
        .map(({ options, ...rest }) => {
          return {
            ...rest,
            options: options.sort(sortFn),
          }
        }),
    },
  }

  return updatedContent
}

interface WithLabel {
  label: string
}
const sortFn = (a: WithLabel, b: WithLabel) => {
  return a.label.localeCompare(b.label, undefined, {
    numeric: true,
  })
}
