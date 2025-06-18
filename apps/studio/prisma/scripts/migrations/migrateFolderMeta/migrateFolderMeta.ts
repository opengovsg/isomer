import { DEFAULT_CHILDREN_PAGES_BLOCK } from "@opengovsg/isomer-components"
import { z } from "zod"

import { db } from "~/server/modules/database"
import {
  getBlobOfResource,
  updateBlobById,
} from "~/server/modules/resource/resource.service"

const folderMetaValidator = z.object({
  order: z.array(z.string()),
})

export const up = async () => {
  const allFolderMeta = await db
    .selectFrom("Resource")
    .where("Resource.type", "=", "FolderMeta")
    // NOTE: `innerJoin` because users cannot create `FolderMeta`
    // and we auto publish.
    // To double check, we should run
    // `select count(*) from "Resource" where "type" = 'FolderMeta' and "draftBlobId" is not null;`
    // and this should return 0
    .innerJoin("Version as v", "v.id", "Resource.publishedVersionId")
    .innerJoin("Blob as pb", "v.blobId", "pb.id")
    .select(["Resource.id", "Resource.parentId", "pb.content"])
    .execute()

  const allParentIds = allFolderMeta.map(({ parentId }) => parentId)

  const idToOrderMapping = new Map(
    allFolderMeta.map(({ id, content }) => [id, content]),
  )

  // NOTE: The `blob.content` is a jsonb with structure: `{ order: ["faq", "contact"] }`
  for (const folderMeta of allFolderMeta) {
    const siblings = await db
      .with("allSiblings", (eb) => {
        return eb
          .selectFrom("Resource")
          .where("parentId", "=", folderMeta.parentId)
          .select(["permalink", "id", "type"])
          .where("type", "!=", "FolderMeta")
      })
      .with("pageSiblings", (eb) => {
        return eb
          .selectFrom("allSiblings")
          .where("type", "=", "Page")
          .selectAll()
      })
      .with("childCousinIndexPages", (eb) => {
        return eb
          .selectFrom("Resource")
          .where("parentId", "in", (qb) =>
            qb
              .selectFrom("allSiblings")
              .where("type", "in", ["Folder", "Collection"]),
          )
          .where("type", "=", "IndexPage")
          .select(["permalink", "id", "type"])
      })
      .selectFrom("pageSiblings")
      .selectAll()
      .union((eb) => eb.selectFrom("childCousinIndexPages").selectAll())
      .selectAll()
      .execute()

    const permalinkToIdMappings = new Map(
      siblings.map(({ id, permalink }) => [permalink, id]),
    )

    const currentFolderMeta = idToOrderMapping.get(folderMeta.id)

    if (!currentFolderMeta) {
      console.error(`No content found for FolderMeta with ID: ${folderMeta.id}`)
      continue
    }

    const validatedMetaResult = folderMetaValidator.safeParse(currentFolderMeta)
    if (!validatedMetaResult.success) {
      console.error(
        `Invalid FolderMeta content for ID: ${folderMeta.id} - ${validatedMetaResult.error}`,
      )
      continue
    }

    const meta = validatedMetaResult.data
    const updatedOrder = meta.order.map((permalink) => {
      const resourceId = permalinkToIdMappings.get(permalink)
      if (!resourceId) {
        console.log(
          `Could not find resource for permalink: ${permalink} in Folder with resourceId: ${folderMeta.parentId}`,
        )
      }
      return resourceId ?? ""
    })

    // NOTE: Need to run forward migration for all index pages
    const indexPageOfFolder = await db
      .selectFrom("Resource")
      .where("Resource.parentId", "=", folderMeta.parentId)
      .where("Resource.type", "=", "IndexPage")
      .select(["Resource.id", "siteId"])
      .executeTakeFirst()

    if (!indexPageOfFolder) {
      console.error(
        `No index page found for folder with Id: ${folderMeta.parentId}`,
      )
      continue
    }

    const indexPageBlob = await db
      .transaction()
      .execute((tx) =>
        getBlobOfResource({ tx, resourceId: indexPageOfFolder.id }),
      )

    const updatedBlob = {
      ...indexPageBlob.content,
      content: [
        // NOTE: Index page should only ever have 1 block
        // We should validate this initially
        {
          ...indexPageBlob.content.content[0],
          childrenPagesOrdering: updatedOrder,
        } as typeof DEFAULT_CHILDREN_PAGES_BLOCK,
      ],
    }

    // TODO: if no draft -> we need to create
    await db.transaction().execute((tx) => {
      return updateBlobById(tx, {
        pageId: Number(indexPageOfFolder.id),
        content: updatedBlob,
        siteId: indexPageOfFolder.siteId,
      })
    })
  }
}

// NOTE: Uncomment the below to run the migration
// await up()

// NOTE: Clean up folderMeta after successful by running this query:
// delete from "Resource" where "type" = 'FolderMeta';
