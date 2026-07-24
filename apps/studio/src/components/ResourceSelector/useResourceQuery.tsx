import type { ResourceItemContent } from "~/schemas/resource"
import { chunk } from "lodash-es"
import { MAX_BATCH_RESOURCE_IDS } from "~/schemas/resource"
import { trpc } from "~/utils/trpc"

interface UseResourceQueryProps {
  siteId: number
  moveDest: ResourceItemContent | undefined
  parentDest: ResourceItemContent | undefined
  isResourceHighlighted: boolean
  showOnlyContainers: boolean
  resourceIds?: ResourceItemContent["id"][]
}

export const useResourceQuery = ({
  siteId,
  moveDest,
  parentDest,
  isResourceHighlighted,
  showOnlyContainers,
  resourceIds,
}: UseResourceQueryProps) => {
  const queryFn = showOnlyContainers
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
      limit: MAX_BATCH_RESOURCE_IDS,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextOffset,
    },
  )

  const useResourceIdsFromSearch = !!resourceIds
  const allResourceIds = useResourceIdsFromSearch
    ? resourceIds
    : pages.flatMap(({ items }) => items).map((item) => item.id)

  // getBatchAncestryWithSelf caps each request at MAX_BATCH_RESOURCE_IDS to
  // bound the cost of its recursive ancestry query. Paging through children
  // with "Load more" grows the accumulated list past that cap, so split it
  // into cap-sized chunks and issue one request per chunk to stay within it.
  const resourceIdChunks = chunk(allResourceIds, MAX_BATCH_RESOURCE_IDS)
  const ancestryQueries = trpc.useQueries((t) =>
    resourceIdChunks.map((chunkedResourceIds) =>
      t.resource.getBatchAncestryWithSelf(
        {
          siteId: String(siteId),
          resourceIds: chunkedResourceIds,
        },
        {
          enabled: !isLoadingChildren,
        },
      ),
    ),
  )

  const isFetchingAncestry = ancestryQueries.some((query) => query.isLoading)
  const resourceItemsWithAncestryStack =
    isLoadingChildren || isFetchingAncestry
      ? undefined
      : ancestryQueries.flatMap((query) => query.data ?? [])

  return {
    resourceItemsWithAncestryStack,
    // oxlint-disable-next-line @typescript-eslint/no-empty-function
    fetchNextPage: useResourceIdsFromSearch ? () => {} : fetchNextPage,
    hasNextPage: useResourceIdsFromSearch ? false : hasNextPage,
    isFetchingNextPage: useResourceIdsFromSearch ? false : isFetchingNextPage,
  }
}
