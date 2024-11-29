import { useCallback, useEffect, useMemo, useState } from "react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { PendingMoveResource } from "~/features/editing-experience/types"
import type { ResourceItemContent } from "~/schemas/resource"
import { trpc } from "~/utils/trpc"

export const useResourceStack = ({
  siteId,
  onChange,
  selectedResourceId,
  onlyShowFolders,
}: {
  siteId: number
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
  const resourceItems: ResourceItemContent[] = useMemo(
    () => pages.flatMap(({ items }) => items),
    [pages],
  )

  const addToStack = useCallback(
    (resourceItemContent: ResourceItemContent): void => {
      const newResource: PendingMoveResource = {
        permalink: resourceItemContent.permalink,
        title: resourceItemContent.title,
        resourceId: resourceItemContent.id,
        parentId: parentDest?.resourceId ?? null,
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

  const fullPermalink: string = useMemo(() => {
    return resourceStack.map((resource) => resource.permalink).join("/")
  }, [resourceStack])

  const resourceItemHandleClick = useCallback(
    (item: ResourceItemContent): void => {
      const isItemHighlighted = isResourceIdHighlighted(item.id)
      const canClickIntoItem =
        item.type === ResourceType.Folder ||
        item.type === ResourceType.Collection

      if (isItemHighlighted && canClickIntoItem) {
        setIsResourceHighlighted(false)
        return
      }

      if (isResourceHighlighted) {
        removeFromStack(1)
      } else {
        setIsResourceHighlighted(true)
      }
      addToStack(item)
    },
    [
      isResourceIdHighlighted,
      isResourceHighlighted,
      addToStack,
      removeFromStack,
    ],
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
    fullPermalink,
    isResourceHighlighted,
    setIsResourceHighlighted,
    moveDest,
    resourceItems,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    removeFromStack,
    isResourceIdHighlighted,
    shouldShowBackButton,
    resourceItemHandleClick,
  }
}

export type UseResourceStackReturn = ReturnType<typeof useResourceStack>
