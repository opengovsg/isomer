import { useCallback, useEffect, useMemo, useState } from "react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ResourceItemContent } from "~/schemas/resource"
import { trpc } from "~/utils/trpc"

export const lastResourceItemInAncestryStack = (
  resourceItemWithAncestryStack: ResourceItemContent[],
): ResourceItemContent | undefined => {
  return resourceItemWithAncestryStack[resourceItemWithAncestryStack.length - 1]
}

export const useResourceStack = ({
  siteId,
  onChange,
  selectedResourceId,
  onlyShowFolders,
  resourceIds,
}: {
  siteId: number
  onChange: (resourceId: string) => void
  selectedResourceId: string | undefined
  onlyShowFolders: boolean
  resourceIds?: ResourceItemContent["id"][]
}) => {
  // NOTE: This is the stack of user's navigation through the resource tree
  // NOTE: We should always start the stack from `/` (root)
  // so that the user will see a full overview of their site structure
  const [resourceStack, setResourceStack] = useState<ResourceItemContent[]>([])

  const [isResourceHighlighted, setIsResourceHighlighted] =
    useState<boolean>(true)

  const moveDest = useMemo(
    () => resourceStack[resourceStack.length - 1], // last item in stack
    [resourceStack],
  )
  const parentDest = useMemo(
    () => resourceStack[resourceStack.length - 2], // second last item in stack
    [resourceStack],
  )
  const curResourceId = useMemo(() => moveDest?.id, [moveDest])

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

  const resourceItemsWithAncestryStack: ResourceItemContent[][] =
    trpc.resource.getBatchAncestryWithSelf
      .useSuspenseQuery({
        siteId: String(siteId),
        resourceIds: !!resourceIds
          ? resourceIds
          : pages.flatMap(({ items }) => items).map((item) => item.id),
      })[0]
      .map((resource) => resource.map((r) => ({ ...r, resourceId: r.id })))

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

  const handleClickResourceItem = (
    resourceItemWithAncestryStack: ResourceItemContent[],
  ): void => {
    const lastChild: ResourceItemContent | undefined =
      lastResourceItemInAncestryStack(resourceItemWithAncestryStack)

    // this should never happen. only added here to satisfy typescript
    if (!lastChild) return

    const isItemHighlighted = isResourceIdHighlighted(lastChild.id)
    const canClickIntoItem =
      lastChild.type === ResourceType.Folder ||
      lastChild.type === ResourceType.Collection

    if (isItemHighlighted && canClickIntoItem) {
      setIsResourceHighlighted(false)
      return
    }

    if (isResourceHighlighted) {
      setResourceStack(resourceItemWithAncestryStack)
    } else {
      setIsResourceHighlighted(true)
    }
  }

  const handleClickBackButton = useCallback(() => {
    if (isResourceHighlighted) {
      setIsResourceHighlighted(false)
      removeFromStack(2)
    } else {
      removeFromStack(1)
    }
  }, [isResourceHighlighted, removeFromStack])

  useEffect(() => {
    // If there is no selected resource, we don't need to update the stack
    if (!selectedResourceId) return

    const pendingMovedItemAncestryStack: ResourceItemContent[] =
      trpc.resource.getAncestryWithSelf
        .useSuspenseQuery({
          siteId: String(siteId),
          resourceId: selectedResourceId,
        })[0]
        .map((resource) => ({ ...resource, resourceId: resource.id }))

    // If the ancestry stack is empty, we don't need to update the stack
    if (pendingMovedItemAncestryStack.length <= 0) return

    // If the ancestry stack is the same as the current stack, we don't need to update the stack
    if (
      JSON.stringify(pendingMovedItemAncestryStack) ===
      JSON.stringify(resourceStack)
    ) {
      return
    }

    setResourceStack(pendingMovedItemAncestryStack)
  }, [])

  useEffect(() => {
    if (curResourceId) {
      onChange(curResourceId)
    }
  }, [curResourceId])

  return {
    fullPermalink,
    moveDest,
    resourceItemsWithAncestryStack,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isResourceIdHighlighted,
    shouldShowBackButton,
    handleClickBackButton,
    handleClickResourceItem,
  }
}

export type UseResourceStackReturn = ReturnType<typeof useResourceStack>
