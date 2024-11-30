import { useCallback, useState } from "react"
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

  const { data, isLoading } = useCallback(() => {
    return trpc.resource.search.useInfiniteQuery({
      siteId,
      query: debouncedSearchTerm,
      resourceTypes,
    })
  }, [siteId, debouncedSearchTerm, resourceTypes])()

  const resources = useCallback((): SearchResultResource[] => {
    return data?.pages.flatMap((page) => page.resources) ?? []
  }, [data])()

  const totalResultsCount = useCallback(() => {
    return (
      data?.pages.reduce((acc, page) => acc + (page.totalCount ?? 0), 0) ?? 0
    )
  }, [data])()

  const recentlyEditedResources = useCallback((): SearchResultResource[] => {
    return data?.pages[0]?.recentlyEdited ?? []
  }, [data])()

  const clearSearchValue = useCallback(() => {
    setSearchValue("")
  }, [setSearchValue])

  return {
    searchValue,
    setSearchValue,
    debouncedSearchTerm,
    resources,
    isLoading,
    totalResultsCount,
    recentlyEditedResources,
    clearSearchValue,
  }
}
