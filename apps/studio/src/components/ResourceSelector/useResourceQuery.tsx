import type { ResourceItemContent } from "~/schemas/resource"
import { chunk } from "lodash-es"
import { useRef } from "react"
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

  // Accumulated ancestry results for browse mode, keyed by resource id.
  // Storing in a ref means each Load-more triggers at most one new ancestry
  // request for the new page's items; prior pages are served from this cache
  // rather than being re-queried on every render or remount.
  const ancestryCacheRef = useRef<Map<string, ResourceItemContent[]>>(new Map())

  const allBrowseIds = pages
    .flatMap(({ items }) => items)
    .map((item) => item.id)

  const idsToFetch = useResourceIdsFromSearch
    ? (resourceIds ?? [])
    : allBrowseIds.filter((id) => !ancestryCacheRef.current.has(id))

  // getBatchAncestryWithSelf caps each request at MAX_BATCH_RESOURCE_IDS to
  // bound the cost of its recursive ancestry query.
  const resourceIdChunks = chunk(idsToFetch, MAX_BATCH_RESOURCE_IDS)
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

  // Merge completed query results into the cache so subsequent renders (and
  // subsequent Load-more clicks) don't re-query the same ids. The mutation is
  // idempotent (same id → same stack), so repeating it is safe.
  if (!isFetchingAncestry && !useResourceIdsFromSearch) {
    for (const query of ancestryQueries) {
      for (const stack of query.data ?? []) {
        if (stack[0]) ancestryCacheRef.current.set(stack[0].id, stack)
      }
    }
  }

  const resourceItemsWithAncestryStack =
    isLoadingChildren || isFetchingAncestry
      ? undefined
      : useResourceIdsFromSearch
        ? ancestryQueries.flatMap((query) => query.data ?? [])
        : allBrowseIds
            .map((id) => ancestryCacheRef.current.get(id))
            .filter(
              (stack): stack is ResourceItemContent[] => stack !== undefined,
            )

  return {
    resourceItemsWithAncestryStack,
    // oxlint-disable-next-line @typescript-eslint/no-empty-function
    fetchNextPage: useResourceIdsFromSearch ? () => {} : fetchNextPage,
    hasNextPage: useResourceIdsFromSearch ? false : hasNextPage,
    isFetchingNextPage: useResourceIdsFromSearch ? false : isFetchingNextPage,
  }
}
