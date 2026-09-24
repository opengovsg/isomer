import type { Client } from "pg"
import { randomUUID } from "crypto"

// Legacy v1 tag shape: { category: string, selected: string[] }
export interface LegacyTag {
  category: string
  selected: string[]
}

type TagCategory = {
  id: string
  label: string
  options: Array<{ id: string; label: string }>
}

type PageContent = {
  page?: {
    tags?: LegacyTag[]
    tagged?: string[]
    tagCategories?: TagCategory[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

type ChildWithTags = {
  id: string
  blobId: string
  content: PageContent
}

const sortByLabel = <T extends { label: string }>(a: T, b: T): number =>
  a.label.localeCompare(b.label, undefined, { numeric: true })

export const migrateTags = (collatedTags: {
  mappings: Record<string, Set<string>>
}): {
  tagCategories: TagCategory[]
  labelToCategoryToId: Record<string, Record<string, string>>
} => {
  const labelToCategoryToId: Record<string, Record<string, string>> = {}

  const tagCategories = Object.entries(collatedTags.mappings)
    .map(([categoryLabel, categoryOptions]) => {
      const categoryId = randomUUID()

      const options = Array.from(categoryOptions.values())
        .map((option) => {
          const id = randomUUID()
          if (!labelToCategoryToId[option]) {
            labelToCategoryToId[option] = {}
          }
          labelToCategoryToId[option][categoryLabel] = id

          return { id, label: option }
        })
        .sort(sortByLabel)

      return { id: categoryId, label: categoryLabel, options }
    })
    .sort(sortByLabel)

  return { tagCategories, labelToCategoryToId }
}

const getLegacyTags = (content: PageContent): LegacyTag[] =>
  (content.page?.tags as LegacyTag[] | undefined) ?? []

export const getCollatedTags = (resourcesWithTags: ChildWithTags[]) => {
  const mappings: Record<string, Set<string>> = {}

  for (const resource of resourcesWithTags) {
    for (const tag of getLegacyTags(resource.content)) {
      let categoryOptions = mappings[tag.category]
      if (!categoryOptions) {
        categoryOptions = new Set()
        mappings[tag.category] = categoryOptions
      }

      for (const value of tag.selected) {
        categoryOptions.add(value)
      }
    }
  }

  return { mappings }
}

export const generateUpdatedContent = (
  blob: PageContent,
  tagsOfResource: LegacyTag[],
  labelToCategoryToId: Record<string, Record<string, string>>,
): PageContent => {
  const { tags: _tags, ...pageWithoutTags } = blob.page ?? {}

  return {
    ...blob,
    page: {
      ...pageWithoutTags,
      tagged: tagsOfResource
        .flatMap(({ category, selected }) =>
          selected.map((label) => labelToCategoryToId[label]?.[category]),
        )
        .filter((value): value is string => !!value),
    },
  }
}

const getChildItemsWithTags = async (
  client: Client,
  collectionId: string,
): Promise<ChildWithTags[]> => {
  const result = await client.query<{
    id: string
    blobId: string
    content: PageContent
  }>(
    `SELECT r.id, v."blobId", b.content
     FROM "Resource" r
     INNER JOIN "Version" v ON r."publishedVersionId" = v.id
     INNER JOIN "Blob" b ON v."blobId" = b.id
     WHERE r."parentId" = $1
       AND jsonb_array_length(b.content -> 'page' -> 'tags') > 0`,
    [collectionId],
  )

  return result.rows
}

const getIndexPagePublishedBlob = async (
  client: Client,
  collectionId: string,
): Promise<{ id: string; blobId: string; content: PageContent }> => {
  const result = await client.query<{
    id: string
    blobId: string
    content: PageContent
  }>(
    `SELECT r.id, v."blobId", b.content
     FROM "Resource" r
     INNER JOIN "Version" v ON r."publishedVersionId" = v.id
     INNER JOIN "Blob" b ON v."blobId" = b.id
     WHERE r."parentId" = $1 AND r.type = 'IndexPage'`,
    [collectionId],
  )

  const indexPage = result.rows[0]

  if (!indexPage) {
    throw new Error(
      `Index page for collection ${collectionId} was not found`,
    )
  }

  return indexPage
}

export const migrateTagsOfCollection = async ({
  client,
  collectionId,
}: {
  client: Client
  collectionId: string
}): Promise<number> => {
  const resourcesWithTags = await getChildItemsWithTags(client, collectionId)

  if (resourcesWithTags.length === 0) {
    console.log("No collection items with legacy tags — skipping tag migration.")
    return 0
  }

  const collatedTags = getCollatedTags(resourcesWithTags)
  const { labelToCategoryToId, tagCategories } = migrateTags(collatedTags)
  const indexPage = await getIndexPagePublishedBlob(client, collectionId)

  const updatedIndexContent: PageContent = {
    ...indexPage.content,
    page: {
      ...indexPage.content.page,
      tagCategories,
    },
  }

  await client.query(`UPDATE "Blob" SET content = $1 WHERE id = $2`, [
    JSON.stringify(updatedIndexContent),
    indexPage.blobId,
  ])
  console.log(
    `Updated index page with ${tagCategories.length} tag categor${tagCategories.length === 1 ? "y" : "ies"}`,
  )

  for (const resource of resourcesWithTags) {
    const tagsOfResource = getLegacyTags(resource.content)
    const updatedContent = generateUpdatedContent(
      resource.content,
      tagsOfResource,
      labelToCategoryToId,
    )

    await client.query(`UPDATE "Blob" SET content = $1 WHERE id = $2`, [
      JSON.stringify(updatedContent),
      resource.blobId,
    ])

    console.log(`Migrated tags on collection item ${resource.id}`)
  }

  return resourcesWithTags.length + 1
}
