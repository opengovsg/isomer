import type { ArticlePagePageProps } from "@opengovsg/isomer-components"
import { trpc } from "~/utils/trpc"

interface UseRequiredTagsValidationProps {
  resourceId: number
  siteId: number
  tagged: ArticlePagePageProps["tagged"]
  enabled?: boolean
}

export function useRequiredTagsValidation({
  resourceId,
  siteId,
  tagged,
  enabled = true,
}: UseRequiredTagsValidationProps) {
  const { data: tags = [] } = trpc.collection.getCollectionTags.useQuery(
    { resourceId, siteId },
    { enabled },
  )

  const unfilledRequiredCategories = tags.filter(
    ({ isRequired, options }) =>
      isRequired && !options.some(({ id }) => tagged?.includes(id)),
  )

  return {
    unfilledRequiredCategories,
    isValid: unfilledRequiredCategories.length === 0,
  }
}
