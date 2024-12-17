import { useCallback, useMemo, useState } from "react"

import type { ResourceItemContent } from "~/schemas/resource"
import { trpc } from "~/utils/trpc"

export const useResourceStack = ({
  siteId,
  selectedResourceId,
  onlyShowFolders,
  existingResource,
  resourceIds,
}: {
  siteId: number
  selectedResourceId: string | undefined
  onlyShowFolders: boolean
  existingResource: ResourceItemContent | undefined
  resourceIds?: ResourceItemContent["id"][]
}) => {
  const [pendingMovedItemAncestryStack] =
    trpc.resource.getAncestryWithSelf.useSuspenseQuery({
      siteId: String(siteId),
      resourceId: existingResource?.id,
    })

  // NOTE: This is the stack of user's navigation through the resource tree
  // NOTE: We should always start the stack from `/` (root)
  // so that the user will see a full overview of their site structure
  const [resourceStack, setResourceStack] = useState<ResourceItemContent[]>(
    pendingMovedItemAncestryStack,
  )

  const [isResourceHighlighted, setIsResourceHighlighted] =
    useState<boolean>(!!selectedResourceId)

  const moveDest = useMemo(
    () => resourceStack[resourceStack.length - 1], // last item in stack
    [resourceStack],
  )
  const parentDest = useMemo(
    () => resourceStack[resourceStack.length - 2], // second last item in stack
    [resourceStack],
  )

  const queryFn = onlyShowFolders
    ? trpc.resource.getFolderChildrenOf.useInfiniteQuery
    : trpc.resource.getChildrenOf.useInfiniteQuery
  const {
    data: { pages } = { pages: [{ items: [], nextOffset: null }] },
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
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
  const [resourceItemsWithAncestryStack] =
    trpc.resource.getBatchAncestryWithSelf.useSuspenseQuery({
      siteId: String(siteId),
      resourceIds: useResourceIdsFromSearch
        ? resourceIds
        : pages.flatMap(({ items }) => items).map((item) => item.id),
    })

  const removeFromStack = useCallback((numberOfResources: number): void => {
    setResourceStack((prev) => prev.slice(0, -numberOfResources))
  }, [])

  const fullPermalink: string = useMemo(() => {
    return resourceStack.map((resource) => resource.permalink).join("/")
  }, [resourceStack])

  // currently do not support fetching next page for search
  return {
    fullPermalink,
    moveDest,
    resourceItemsWithAncestryStack,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    fetchNextPage: useResourceIdsFromSearch ? () => {} : fetchNextPage,
    hasNextPage: useResourceIdsFromSearch ? false : hasNextPage,
    isFetchingNextPage: useResourceIdsFromSearch ? false : isFetchingNextPage,
    resourceStack,
    isResourceHighlighted,
    setIsResourceHighlighted,
    setResourceStack,
    removeFromStack,
  }
}
