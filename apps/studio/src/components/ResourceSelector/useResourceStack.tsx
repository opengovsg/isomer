import { useCallback, useEffect, useMemo, useState } from "react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ResourceItemContent } from "~/schemas/resource"
import { trpc } from "~/utils/trpc"

export const useResourceStack = ({
  siteId,
  onChange,
  selectedResourceId,
  onlyShowFolders,
  resourceIds = [],
}: {
  siteId: number
  onChange: (resourceId: string) => void
  selectedResourceId: string | undefined
  onlyShowFolders: boolean
  resourceIds?: string[]
}) => {
  // NOTE: This is the stack of user's navigation through the resource tree
  // NOTE: We should always start the stack from `/` (root)
  // so that the user will see a full overview of their site structure
  const [resourceStack, setResourceStack] = useState<ResourceItemContent[]>([])

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
  const curResourceId = useMemo(() => moveDest?.id, [moveDest])

  const existingAncestryStack: ResourceItemContent[] =
    trpc.resource.getAncestryWithSelf
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
        resourceIds:
          resourceIds.length > 0
            ? resourceIds
            : pages.flatMap(({ items }) => items).map((item) => item.id),
      })[0]
      .map((resource) => resource.map((r) => ({ ...r, resourceId: r.id })))

  console.log(2222, resourceItemsWithAncestryStack)

  const resourceItems: ResourceItemContent[] = useMemo(
    () => pages.flatMap(({ items }) => items),
    [pages],
  )
  console.log(1111, resourceItems)

  const addToStack = useCallback(
    (resourceItemContent: ResourceItemContent): void => {
      setResourceStack((prev) => [...prev, resourceItemContent])
    },
    [],
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
      existingAncestryStack.length <= 0 ||
      JSON.stringify(existingAncestryStack) === JSON.stringify(resourceStack)
    ) {
      return
    }
    setResourceStack(existingAncestryStack)
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
