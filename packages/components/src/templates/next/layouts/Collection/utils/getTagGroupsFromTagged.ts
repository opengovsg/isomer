import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  TagGroup,
} from "~/types"
import {
  resolveTagCategoryDisplay,
  TAG_CATEGORY_DISPLAY_OPTIONS,
} from "~/types/constants"

export interface GetTagGroupsFromTaggedProps {
  tagged: ArticlePagePageProps["tagged"]
  tagCategories: CollectionPagePageProps["tagCategories"]
}

export interface GetTagGroupsFromTaggedResult {
  pillTags: TagGroup[] | undefined
  plaintextTags: TagGroup[] | undefined
  allTags: TagGroup[] | undefined
}

// NOTE: Shared by getCollectionItems (cards) and Article (article header) so both
// split `tagged` into pill/plaintext groups the same way, in a single pass over
// `tagCategories`.
export const getTagGroupsFromTagged = ({
  tagged,
  tagCategories,
}: GetTagGroupsFromTaggedProps): GetTagGroupsFromTaggedResult => {
  if (!tagged || !tagCategories) {
    return { pillTags: undefined, plaintextTags: undefined, allTags: undefined }
  }

  const pillTags: TagGroup[] = []
  const plaintextTags: TagGroup[] = []

  for (const { id, label, options, display } of tagCategories) {
    const selected = options
      .filter(({ id: optionId }) => tagged.includes(optionId))
      .map(({ label }) => label)

    if (selected.length === 0) {
      continue
    }

    const group: TagGroup = { id, label, selected }

    if (
      resolveTagCategoryDisplay(display) === TAG_CATEGORY_DISPLAY_OPTIONS.Pills
    ) {
      pillTags.push(group)
    } else {
      plaintextTags.push(group)
    }
  }

  const allTags =
    pillTags.length > 0 || plaintextTags.length > 0
      ? [...pillTags, ...plaintextTags]
      : []

  return { pillTags, plaintextTags, allTags }
}
