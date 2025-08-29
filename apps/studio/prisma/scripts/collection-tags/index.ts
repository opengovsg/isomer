import { randomUUID, UUID } from "crypto"
import _ from "lodash"

import { db, jsonb, ResourceType, sql } from "~/server/modules/database"
import {
  getBlobOfResource,
  updateBlobById,
} from "~/server/modules/resource/resource.service"

// NOTE: this is the `Blob`.`content` of a `CollectionPage` that contains a tag
// {
//     "meta": {
//         "image": "/36/7607feb6-f9e8-46f1-b639-2d189391511e/IOTX0108-L.png"
//     },
//     "page": {
//         "ref": "[resource:36:33844]",
//         "date": "12/12/2024",
//         "tags": [
//             {
//                 "category": "CLS Level",
//                 "selected": [
//                     "Level 1 ✱"
//                 ]
//             },
//             {
//                 "category": "Brand",
//                 "selected": [
//                     "TP-Link"
//                 ]
//             }
//         ],
//         "image": {
//             "alt": "TP-Link Tapo C211",
//             "src": "/36/6c8621d0-0284-47a9-92d5-70ccf89bdca4/IOTX0108-P.jpg"
//         },
//         "title": "TP-Link Tapo C211",
//         "category": "IP Camera",
//         "description": "Pan/Tilt Home Security Wi-Fi Camera\nIssued date: 12 December 2024\nExpiry date: 11 December 2027"
//     },
//     "layout": "link",
//     "content": [],
//     "version": "0.1.0"
// }

// NOTE: old tag is `category: string + selected: string[]`
export interface LegacyTag {
  category: string
  selected: string[]
}

export interface TagValue {
  // NOTE: holds the `uuid` of the selected value
  selected: UUID[]
}

export interface TagOption {
  // label is what's shown to our end user
  label: string
  id: UUID
}

export interface TagCategory {
  id: UUID
  label: string
  options: TagOption[]
}

export type TagCategories = TagCategory[]

export const up = async () => {
  // select * from "Blob" where jsonb_array_length("content" -> 'page' -> 'tags') > 0;
  // 10190 blobs that have tags but total of 8312 distinct (replace `parentId` below with `id`)
  //
  // SELECT DISTINCT
  // "Resource"."parentId"
  //  FROM
  // "Resource"
  // LEFT JOIN "Version" ON "Version"."id" = "Resource"."publishedVersionId"
  // LEFT JOIN "Blob" AS "draft_blob" ON "draft_blob"."id" = "Resource"."draftBlobId"
  // LEFT JOIN "Blob" AS "published_blob" ON "published_blob"."id" = "Version"."blobId"
  //  WHERE
  // (
  // 	jsonb_array_length("draft_blob"."content" -> 'page' -> 'tags') > 0
  // 	OR jsonb_array_length("published_blob"."content" -> 'page' -> 'tags') > 0
  // )
  //
  // 54 collections containing tags

  const collectionIds = await getCollectionsWithTags()
  const publisher = await db
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

    const { labelToId, tagCategories } = migrateTags(collatedTags)
    const indexPage = await db
      .selectFrom("Resource")
      .where("type", "=", "IndexPage")
      .where("parentId", "=", id)
      .selectAll()
      // NOTE: assumption - every collection has an index page
      // we should always run the other migration `addCollectionIndexPage` first
      .executeTakeFirstOrThrow()

    // NOTE: we need to do 2 things in this `tx`
    // Step 1: write to the index page with the newly generated tags
    // Step 2: write the updated mappings to each individual page
    await db.transaction().execute(async (tx) => {
      console.log(`Updating the draft blob of index page: ${indexPage.id}`)
      const indexPageBlob = await getBlobOfResource({
        tx,
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
          labelToId,
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
            labelToId,
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

const getChildItemsWithTags = async (parentId: string) => {
  return db
    .selectFrom("Resource")
    .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
    .leftJoin("Blob as draftBlob", "draftBlob.id", "Resource.draftBlobId")
    .leftJoin("Blob as publishedBlob", "publishedBlob.id", "Version.blobId")
    .select((eb) => {
      return [
        "draftBlob.content as draftBlobContent",
        "publishedBlob.content as publishedBlobContent",
        // NOTE: If the published version has tags, we need to also
        // update it in place so that we don't have a long tail
        // and we can remove the outdated code
        sql<boolean>`jsonb_array_length("publishedBlob"."content" -> 'page' -> 'tags') > 0`.as(
          "requiresPublish",
        ),
        "Resource.id",
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
    .where((eb) =>
      eb.or([
        sql<boolean>`jsonb_array_length("draftBlob"."content" -> 'page' -> 'tags') > 0`,
        sql<boolean>`jsonb_array_length("publishedBlob"."content" -> 'page' -> 'tags') > 0`,
      ]),
    )
    .where("parentId", "=", parentId)
    .execute()
}

const migrateTags = (collatedTags: {
  categories: Set<string>
  mappings: Record<string, Set<string>>
}) => {
  const labelToId: Record<string, UUID> = {}

  const tagCategories: TagCategories = _.entries(collatedTags.mappings).map(
    ([categoryLabel, categoryOptions]) => {
      const categoryId = randomUUID()

      const options = Array.from(categoryOptions.values()).map((option) => {
        const id = randomUUID()
        const label = option
        labelToId[label] = id

        return {
          id,
          label,
        }
      })

      return { id: categoryId, options, label: categoryLabel }
    },
  )

  return {
    tagCategories,
    labelToId,
  }
}

async function getCollectionsWithTags() {
  return await db
    .selectFrom("Resource")
    .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
    .leftJoin("Blob as draftBlob", "draftBlob.id", "Resource.draftBlobId")
    .leftJoin("Blob as publishedBlob", "publishedBlob.id", "Version.blobId")
    .select("Resource.parentId as id")
    .distinct()
    .where((eb) =>
      eb.or([
        sql<boolean>`jsonb_array_length("draftBlob"."content" -> 'page' -> 'tags') > 0`,
        sql<boolean>`jsonb_array_length("publishedBlob"."content" -> 'page' -> 'tags') > 0`,
      ]),
    )
    // NOTE: 6 folders have pages with tags
    .where("type", "!=", ResourceType.Page)
    .execute()
}

function generateUpdatedContent(
  blob: PrismaJson.BlobJsonContent,
  tagsOfResource: LegacyTag[],
  labelToId: Record<string, UUID>,
): PrismaJson.BlobJsonContent {
  return {
    ...blob,
    page: {
      ...blob.page,
      // NOTE: we CANNOT reuse `tags` because our existing tags use it...
      // If we replace the existing labels because it'll cause the sites to have the uuid
      // on the next rebuild due to this feature not being released.
      // We also cannot add on this label,
      // because it will hinder deletion.
      tagged: tagsOfResource
        .flatMap(({ selected }) => selected.map((label) => labelToId[label]))
        .filter((v) => !!v),
    },
  }
}

const getCollatedTags = async (
  resourcesWithTags: Awaited<ReturnType<typeof getChildItemsWithTags>>,
) => {
  const tags: LegacyTag[][] = resourcesWithTags.flatMap(
    // NOTE: have to cast here - this is because we take our type defs from
    // the schema, but we haven't narrowed the type down.
    // However, note that in `getChildPagesWithTags`, we only select
    // the pages with tags
    // NOTE: `any` cast here - accessor is guaranteed due to db query
    // and this code won't live long in our codebase (if at all)
    (resource) => {
      let draftTags: LegacyTag[] = []
      if (resource.draftBlobContent) {
        draftTags =
          ((resource.draftBlobContent.page as any).tags as LegacyTag[]) ?? []
      }

      let publishedTags: LegacyTag[] = []
      if (resource.publishedBlobContent) {
        publishedTags =
          ((resource.publishedBlobContent.page as any).tags as LegacyTag[]) ??
          []
      }

      return [draftTags, publishedTags]
    },
  )

  console.log(tags)

  const baseTags: {
    categories: Set<string>
    mappings: Record<string, Set<string>>
  } = {
    categories: new Set(),
    // NOTE: mappings denotes the mapping of category -> options
    mappings: {},
  }

  const collatedTags = tags.reduce((prevTags, curTags) => {
    curTags.forEach((tag) => {
      prevTags.categories.add(tag.category)
      tag.selected.forEach((value) => {
        let prevCategorySet = prevTags.mappings[tag.category]
        if (!prevCategorySet) {
          prevTags.mappings[tag.category] = new Set()
          prevCategorySet = prevTags.mappings[tag.category]
        }

        prevCategorySet!.add(value)
      })
    })

    return prevTags
  }, baseTags)

  return collatedTags
}

await up()
