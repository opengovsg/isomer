import { type ResourceItemContent } from "~/schemas/resource"
import { trpc } from "~/utils/trpc"

interface UseResourceQueryProps {
  siteId: number
  moveDest: ResourceItemContent | undefined
  parentDest: ResourceItemContent | undefined
  isResourceHighlighted: boolean
  onlyShowFolders: boolean
  resourceIds?: ResourceItemContent["id"][]
}

export const useResourceQuery = ({
  siteId,
  moveDest,
  parentDest,
  isResourceHighlighted,
  onlyShowFolders,
  resourceIds,
}: UseResourceQueryProps) => {
  const queryFn = onlyShowFolders
    ? trpc.resource.getFolderChildrenOf.useInfiniteQuery
    : trpc.resource.getChildrenOf.useInfiniteQuery
  const {
    data: { pages } = { pages: [{ items: [], nextOffset: null }] },
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingChildren,
  } = queryFn(
    {
      resourceId:
        (isResourceHighlighted ? parentDest?.id : moveDest?.id) ?? null,
      siteId: String(siteId),
      limit: 25,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextOffset,
    },
  )

  const useResourceIdsFromSearch = !!resourceIds
  const { data: resourceItemsWithAncestryStack } =
    trpc.resource.getBatchAncestryWithSelf.useQuery(
      {
        siteId: String(siteId),
        resourceIds: useResourceIdsFromSearch
          ? resourceIds
          : pages.flatMap(({ items }) => items).map((item) => item.id),
      },
      {
        enabled: !isLoadingChildren,
      },
    )

  return {
    resourceItemsWithAncestryStack,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    fetchNextPage: useResourceIdsFromSearch ? () => {} : fetchNextPage,
    hasNextPage: useResourceIdsFromSearch ? false : hasNextPage,
    isFetchingNextPage: useResourceIdsFromSearch ? false : isFetchingNextPage,
  }
}
