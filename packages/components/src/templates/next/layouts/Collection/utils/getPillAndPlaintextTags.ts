import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  TagGroup,
} from "~/types"
import {
  resolveTagCategoryDisplay,
  TAG_CATEGORY_DISPLAY_OPTIONS,
} from "~/types/constants"

import { buildTagGroupsFromTagged } from "./buildTagGroupsFromTagged"

interface GetPillAndPlaintextTagsResult {
  pillTags: TagGroup[] | undefined
  plaintextTags: TagGroup[] | undefined
  tags: TagGroup[] | undefined
}

const splitTagGroupsByDisplay = (
  groups: TagGroup[],
  tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]>,
): Pick<GetPillAndPlaintextTagsResult, "pillTags" | "plaintextTags"> => {
  const pillTags: TagGroup[] = []
  const plaintextTags: TagGroup[] = []

  for (const group of groups) {
    const tagCategory = tagCategories.find(
      ({ id, label }) => id === group.id || label === group.category,
    )
    const display = resolveTagCategoryDisplay(tagCategory?.display)

    if (display === TAG_CATEGORY_DISPLAY_OPTIONS.Pills) {
      pillTags.push(group)
    } else {
      plaintextTags.push(group)
    }
  }

  return { pillTags, plaintextTags }
}

// NOTE: Shared by getCollectionItems (cards) and Article (article header). Builds
// tag groups once (including Category → "Others" fallback), then splits by display.
export const getPillAndPlaintextTags = (
  tagged: ArticlePagePageProps["tagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
): GetPillAndPlaintextTagsResult => {
  if (!tagCategories) {
    return { pillTags: undefined, plaintextTags: undefined, tags: undefined }
  }

  const tags = buildTagGroupsFromTagged(tagged, tagCategories)
  const { pillTags, plaintextTags } = splitTagGroupsByDisplay(
    tags,
    tagCategories,
  )

  return {
    pillTags,
    plaintextTags,
    tags: tags.length > 0 ? tags : undefined,
  }
}
