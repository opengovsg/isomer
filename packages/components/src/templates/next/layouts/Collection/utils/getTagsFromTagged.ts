import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  TagGroup,
} from "~/types"

import { buildTagGroupsFromTagged } from "./buildTagGroupsFromTagged"

export const getTagsFromTagged = (
  tagged: ArticlePagePageProps["tagged"],
  tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]>,
): TagGroup[] => {
  return buildTagGroupsFromTagged(tagged, tagCategories)
}
