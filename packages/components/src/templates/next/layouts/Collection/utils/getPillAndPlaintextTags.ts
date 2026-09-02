import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  TagGroup,
} from "~/types"
import {
  resolveTagCategoryDisplay,
  TAG_CATEGORY_DISPLAY_OPTIONS,
} from "~/types/constants"
import { isTextFilter } from "~/types/page"

interface GetPillAndPlaintextTagsResult {
  pillTags: TagGroup[] | undefined
  plaintextTags: TagGroup[] | undefined
}

// NOTE: Shared by getCollectionItems (cards) and Article (article header) so both
// split `tagged` into pill/plaintext groups the same way, in a single pass over
// `tagCategories` rather than filtering + `getTagsFromTagged`-ing it twice.
export const getPillAndPlaintextTags = (
  tagged: ArticlePagePageProps["tagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
): GetPillAndPlaintextTagsResult => {
  if (!tagged || !tagCategories) {
    return { pillTags: undefined, plaintextTags: undefined }
  }

  const pillTags: TagGroup[] = []
  const plaintextTags: TagGroup[] = []

  for (const tagCategory of tagCategories) {
    // NOTE: date filters have no `options`/`tagged` membership — their
    // status pill is derived separately (see resolveItemDateFields) and never
    // flows through pillTags/plaintextTags.
    if (!isTextFilter(tagCategory)) {
      continue
    }
    const { id, label, options, display } = tagCategory

    const selected = options
      .filter(({ id: optionId }) => tagged.includes(optionId))
      .map(({ label }) => label)

    if (selected.length === 0) {
      continue
    }

    const group: TagGroup = { id, category: label, selected }

    if (
      resolveTagCategoryDisplay(display) === TAG_CATEGORY_DISPLAY_OPTIONS.Pills
    ) {
      pillTags.push(group)
    } else {
      plaintextTags.push(group)
    }
  }

  return { pillTags, plaintextTags }
}
