import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  TagGroup,
} from "~/types"

import { CATEGORY_GROUP_LABEL, CATEGORY_OTHERS_LABEL } from "./constants"

export const tagGroupMatchesFilterCategory = (
  { id, category }: Pick<TagGroup, "id" | "category">,
  filterCategoryId: string,
): boolean => {
  return id === filterCategoryId || category === filterCategoryId
}

export const buildTagGroupsFromTagged = (
  tagged: ArticlePagePageProps["tagged"],
  tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]>,
): TagGroup[] => {
  const taggedIds = tagged ?? []
  const groups: TagGroup[] = []

  for (const { id, label, options } of tagCategories) {
    const selected = options
      .filter(({ id: optionId }) => taggedIds.includes(optionId))
      .map(({ label: optionLabel }) => optionLabel)

    if (selected.length === 0) {
      continue
    }

    groups.push({ id, category: label, selected })
  }

  const categoryGroup = tagCategories.find(
    ({ label }) => label === CATEGORY_GROUP_LABEL,
  )
  const hasCategoryTag = groups.some((group) =>
    tagGroupMatchesFilterCategory(
      group,
      categoryGroup?.id ?? CATEGORY_GROUP_LABEL,
    ),
  )

  if (categoryGroup && !hasCategoryTag) {
    groups.push({
      id: categoryGroup.id,
      category: categoryGroup.label,
      selected: [CATEGORY_OTHERS_LABEL],
    })
  }

  return groups
}
