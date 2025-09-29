import { randomUUID, UUID } from "crypto"
import { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { db, sql } from "~server/modules/database"
import _ from "lodash"

// NOTE: old tag is `category: string + selected: string[]`
export interface LegacyTag {
  category: string
  selected: string[]
}

type TagCategories = NonNullable<CollectionPagePageProps["tagCategories"]>

interface ChildrenWithTags {
  draftBlobContent: PrismaJson.BlobJsonContent | null
  publishedBlobContent: PrismaJson.BlobJsonContent | null
  id: string
  requiresPublish: boolean
  content: PrismaJson.BlobJsonContent
  blobId: string | null
  draftBlobId: string | null
}
export const getChildItemsWithTags = async (
  parentId: string,
): Promise<ChildrenWithTags[]> => {
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

export const migrateTags = (collatedTags: {
  categories: Set<string>
  mappings: Record<string, Set<string>>
}) => {
  const labelToCategoryToId: Record<string, Record<string, UUID>> = {}

  const tagCategories: TagCategories = _.entries(collatedTags.mappings).map(
    ([categoryLabel, categoryOptions]) => {
      const categoryId = randomUUID()

      const options = Array.from(categoryOptions.values()).map((option) => {
        const id = randomUUID()
        const label = option
        if (!labelToCategoryToId[label]) {
          labelToCategoryToId[label] = {}
        }
        labelToCategoryToId[label][categoryLabel] = id

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
    labelToCategoryToId,
  }
}

export async function getCollectionsOfSiteWithTags(siteId: number) {
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
    .where("siteId", "=", siteId)
    .execute()
}

export function generateUpdatedContent(
  blob: PrismaJson.BlobJsonContent,
  tagsOfResource: LegacyTag[],
  labelToCategoryToId: Record<string, Record<string, UUID>>,
): PrismaJson.BlobJsonContent {
  return {
    ...blob,
    page: {
      ..._.omit(blob.page, "tags"),
      // NOTE: we CANNOT reuse `tags` because our existing tags use it...
      // If we replace the existing labels because it'll cause the sites to have the uuid
      // on the next rebuild due to this feature not being released.
      // We also cannot add on this label,
      // because it will hinder deletion.
      tagged: tagsOfResource
        .flatMap(({ category, selected }) =>
          selected.map((label) => labelToCategoryToId[label]?.[category]),
        )
        .filter((v) => !!v),
    },
  }
}

export const getCollatedTags = async (
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

      if (resource.draftBlobContent?.page) {
        draftTags =
          ((resource.draftBlobContent.page as any).tags as LegacyTag[]) ?? []
      }

      let publishedTags: LegacyTag[] = []
      if (resource.publishedBlobContent?.page) {
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
