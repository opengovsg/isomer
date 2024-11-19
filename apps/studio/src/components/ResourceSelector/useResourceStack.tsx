import { useCallback, useEffect, useMemo, useState } from "react"

import type { PendingMoveResource } from "~/features/editing-experience/types"
import type { ResourceChildrenOfType } from "~/schemas/resource"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { trpc } from "~/utils/trpc"

export const useResourceStack = ({
  onChange,
  selectedResourceId,
  onlyShowFolders,
}: {
  onChange: (resourceId: string) => void
  selectedResourceId: string | undefined
  onlyShowFolders: boolean
}) => {
  // NOTE: This is the stack of user's navigation through the resource tree
  // NOTE: We should always start the stack from `/` (root)
  // so that the user will see a full overview of their site structure
  const [resourceStack, setResourceStack] = useState<PendingMoveResource[]>([])

  const [isResourceHighlighted, setIsResourceHighlighted] =
    useState<boolean>(true)

  const { siteId } = useQueryParse(sitePageSchema)

  const moveDest = useMemo(
    () => resourceStack[resourceStack.length - 1],
    [resourceStack],
  )
  const parentDest = useMemo(
    () => resourceStack[resourceStack.length - 2],
    [resourceStack],
  )
  const curResourceId = useMemo(() => moveDest?.resourceId, [moveDest])

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

  const addToStack = useCallback(
    ({
      resourceChildrenOfType,
    }: {
      resourceChildrenOfType: ResourceChildrenOfType["items"][number]
    }): void => {
      const newResource: PendingMoveResource = {
        ...resourceChildrenOfType,
        parentId: parentDest?.resourceId ?? null,
        resourceId: resourceChildrenOfType.id,
      }
      setResourceStack((prev) => [...prev, newResource])
    },
    [parentDest],
  )

  const removeFromStack = useCallback((numberOfResources: number): void => {
    setResourceStack((prev) => prev.slice(0, -numberOfResources))
  }, [])

  const isResourceIdHighlighted = useCallback(
    (resourceId: string): boolean => {
      return isResourceHighlighted && curResourceId === resourceId
    },
    [isResourceHighlighted, curResourceId],
  )

  const shouldShowBackButton = useMemo(
    () =>
      (resourceStack.length === 1 && !isResourceHighlighted) ||
      resourceStack.length > 1,
    [resourceStack.length, isResourceHighlighted],
  )

  useEffect(() => {
    if (
      ancestryStack.length <= 0 ||
      JSON.stringify(ancestryStack) === JSON.stringify(resourceStack)
    ) {
      return
    }
    setResourceStack(ancestryStack)
  }, [])

  useEffect(() => {
    if (curResourceId) {
      onChange(curResourceId)
    }
  }, [curResourceId])

  return {
    resourceStack,
    isResourceHighlighted,
    setIsResourceHighlighted,
    moveDest,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    addToStack,
    removeFromStack,
    isResourceIdHighlighted,
    shouldShowBackButton,
  }
}

export type UseResourceStackReturn = ReturnType<typeof useResourceStack>
