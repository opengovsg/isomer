import type { ImageProps } from "~/interfaces"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { FormattedDate, TagGroup } from "~/types"

interface TestCollectionItemInput {
  title?: string
  description?: string
  id?: string
  itemTitle?: string
  referenceLinkHref?: string | undefined
  imageSrc?: string | undefined
  date?: Date
  tags?: TagGroup[]
  pillTags?: TagGroup[]
  plaintextTags?: TagGroup[]
  image?: Pick<ImageProps, "src" | "alt">
  isContainNeeded?: boolean
  formattedDate?: FormattedDate
}

export const testCollectionItem = (
  overrides: TestCollectionItemInput = {},
): ProcessedCollectionCardProps => {
  const { title = "Test Title", description = "", ...rest } = overrides

  const item = {
    id: "test-id",
    itemTitle: title,
    referenceLinkHref: undefined,
    imageSrc: undefined,
    title,
    description,
    ...rest,
  }
  // SAFETY: test fixture only supplies known ProcessedCollectionCardProps fields
  return item as ProcessedCollectionCardProps
}
