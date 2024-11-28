import { useState } from "react"
import { useDebounce } from "@uidotdev/usehooks"

import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import type { ResourceType } from "~prisma/generated/generatedEnums"
import { trpc } from "~/utils/trpc"

interface UseSearchQueryProps {
  siteId: string
  resourceTypes: ResourceType[]
}
export const useSearchQuery = ({
  siteId,
  resourceTypes,
}: UseSearchQueryProps) => {
  const [searchValue, setSearchValue] = useState("")
  const debouncedSearchTerm = useDebounce(searchValue, 300)

  const { data, isLoading } = trpc.resource.search.useInfiniteQuery({
    siteId,
    query: debouncedSearchTerm,
    resourceTypes,
  })

  const resources: SearchResultResource[] =
    data?.pages.flatMap((page) => page.resources) ?? []

  const totalResultsCount =
    data?.pages.reduce((acc, page) => acc + (page.totalCount ?? 0), 0) ?? 0

  const recentlyEditedResources: SearchResultResource[] =
    data?.pages[0]?.recentlyEdited ?? []

  return {
    searchValue,
    setSearchValue,
    debouncedSearchTerm,
    resources,
    isLoading,
    totalResultsCount,
    recentlyEditedResources,
  }
}
