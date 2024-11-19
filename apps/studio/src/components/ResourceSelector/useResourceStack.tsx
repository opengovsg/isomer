import { useState } from "react"

import type { PendingMoveResource } from "~/features/editing-experience/types"
import type { ResourceChildrenOfType } from "~/schemas/resource"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { trpc } from "~/utils/trpc"

export const useResourceStack = ({
  onlyShowFolders,
  selectedResourceId,
}: {
  onlyShowFolders: boolean
  selectedResourceId: string | undefined
}) => {
  // NOTE: This is the stack of user's navigation through the resource tree
  // NOTE: We should always start the stack from `/` (root)
  // so that the user will see a full overview of their site structure
  const [resourceStack, setResourceStack] = useState<PendingMoveResource[]>([])

  const [isResourceHighlighted, setIsResourceHighlighted] =
    useState<boolean>(true)

  const { siteId } = useQueryParse(sitePageSchema)

  const moveDest = resourceStack[resourceStack.length - 1]
  const parentDest = resourceStack[resourceStack.length - 2]
  const curResourceId = moveDest?.resourceId

  const ancestryStack: PendingMoveResource[] = trpc.resource.getAncestryWithSelf
    .useSuspenseQuery({
      siteId: String(siteId),
      resourceId: selectedResourceId,
    })[0]
    .map((resource) => ({ ...resource, resourceId: resource.id }))

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
        (isResourceHighlighted
          ? parentDest?.resourceId
          : moveDest?.resourceId) ?? null,
      siteId: String(siteId),
      limit: 25,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextOffset,
    },
  )
  const data: ResourceChildrenOfType[] = pages

  return {
    resourceStack,
    setResourceStack,
    isResourceHighlighted,
    setIsResourceHighlighted,
    moveDest,
    parentDest,
    curResourceId,
    ancestryStack,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
}

export type UseResourceStackReturn = ReturnType<typeof useResourceStack>
