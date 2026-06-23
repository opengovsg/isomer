import type { ArticlePagePageProps } from "@opengovsg/isomer-components"

import type { CollectionTags } from "./useCollectionTags"
import { useCollectionTags } from "./useCollectionTags"

function validateRequiredTags(
  tags: CollectionTags,
  tagged: ArticlePagePageProps["tagged"],
) {
  const unfilledRequiredCategories = tags.filter(
    ({ isRequired, options }) =>
      isRequired && !options.some(({ id }) => tagged?.includes(id)),
  )

  return {
    unfilledRequiredCategories,
    isValid: unfilledRequiredCategories.length === 0,
  }
}

interface UseRequiredTagsValidationWithTags {
  tags: CollectionTags
  tagged: ArticlePagePageProps["tagged"]
}

interface UseRequiredTagsValidationWithFetch {
  resourceId: number
  siteId: number
  tagged: ArticlePagePageProps["tagged"]
  enabled?: boolean
}

type UseRequiredTagsValidationProps =
  | UseRequiredTagsValidationWithTags
  | UseRequiredTagsValidationWithFetch

export function useRequiredTagsValidation(
  props: UseRequiredTagsValidationProps,
) {
  const shouldFetch = "resourceId" in props

  const { data: fetchedTags = [] } = useCollectionTags({
    resourceId: shouldFetch ? props.resourceId : 0,
    siteId: shouldFetch ? props.siteId : 0,
    enabled: shouldFetch && (props.enabled ?? true),
  })

  const tags = "tags" in props ? props.tags : fetchedTags

  return validateRequiredTags(tags, props.tagged)
}
