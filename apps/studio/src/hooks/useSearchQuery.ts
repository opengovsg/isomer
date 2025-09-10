import { useCallback, useEffect, useMemo, useState } from "react"
import { useDebounce } from "@uidotdev/usehooks"

import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import type { ResourceType } from "~prisma/generated/generatedEnums"
import { trpc } from "~/utils/trpc"

interface UseSearchQueryProps {
  siteId: string
  resourceTypes: ResourceType[]
  onSearchSuccess?: () => void
}
export const useSearchQuery = ({
  siteId,
  resourceTypes,
  onSearchSuccess,
}: UseSearchQueryProps) => {
  const [searchValue, setSearchValue] = useState("")
  const debouncedSearchTerm = useDebounce(searchValue, 300)

  const { data, isLoading } = trpc.resource.search.useInfiniteQuery(
    {
      siteId,
      query: debouncedSearchTerm,
      resourceTypes,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextOffset,
    },
  )

  useEffect(() => {
    if (data) {
      onSearchSuccess?.()
    }
  }, [data, onSearchSuccess])

  const matchedResources = useMemo((): SearchResultResource[] => {
    return data?.pages.flatMap((page) => page.resources) ?? []
  }, [data])

  const totalResultsCount = useMemo(() => {
    return (
      data?.pages.reduce((acc, page) => acc + (page.totalCount ?? 0), 0) ?? 0
    )
  }, [data])

  const recentlyEditedResources = useMemo((): SearchResultResource[] => {
    return data?.pages[0]?.recentlyEdited ?? []
  }, [data])

  const clearSearchValue = useCallback(() => {
    setSearchValue("")
  }, [setSearchValue])

  return {
    searchValue,
    setSearchValue,
    debouncedSearchTerm,
    matchedResources,
    isLoading,
    totalResultsCount,
    recentlyEditedResources,
    clearSearchValue,
  }
}
