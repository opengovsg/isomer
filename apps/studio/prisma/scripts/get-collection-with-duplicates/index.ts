import { appendFileSync } from "node:fs"
import { CollectionPagePageProps } from "@opengovsg/isomer-components"

import { db } from "~/server/modules/database"

const getCollectionIndexPages = async () => {
  const collectionIndexPages = await db
    .selectFrom("Resource")
    .where("parentId", "in", (eb) =>
      eb
        .selectFrom("Resource")

        .where("type", "=", "Collection")
        .select("id"),
    )
    .where("type", "=", "IndexPage")
    .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
    .select(["Resource.id", "Resource.parentId", "Blob.content"])
    .execute()

  return collectionIndexPages
}

export const up = async () => {
  const collectionIndexPages = await getCollectionIndexPages()
  const indexPagesWithTagCategories = collectionIndexPages.filter(
    ({ content }) => {
      return (
        !!content.page.tagCategories && content.page.tagCategories.length > 0
      )
    },
  )

  console.log(`found ${indexPagesWithTagCategories.length} index pages`)
  for (const indexPage of indexPagesWithTagCategories) {
    console.log(`processing index page ${indexPage.id}`)
    const hasDuplicates = computeHasDuplicates(
      (indexPage.content.page as CollectionPagePageProps).tagCategories,
    )

    if (hasDuplicates) {
      console.log(`found duplicates in index page ${indexPage.id}`)
      appendFileSync("results.txt", `${indexPage.parentId}\n`)
    }
  }
}

await up()

function computeHasDuplicates(
  tagCategories:
    | { id: string; label: string; options: { id: string; label: string }[] }[]
    | undefined,
) {
  if (!tagCategories) return false

  // NOTE: done for typing otherwise ts infers `[]` as `never[]`
  let baseLabels: string[] = []

  const allLabels = tagCategories?.reduce((prev, cur) => {
    const labels = cur.options.map((option) => option.label)
    return [...prev, ...labels]
  }, baseLabels)

  const allLabelsSet = new Set(allLabels)

  return allLabelsSet.size !== allLabels.length
}
