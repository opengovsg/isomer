import { useCallback, useMemo, useState } from "react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ResourceItemContent } from "~/schemas/resource"
import { isAllowedToHaveChildren } from "~/utils/resources"
import { trpc } from "~/utils/trpc"
import { lastResourceItemInAncestryStack } from "./utils"

export const useResourceStack = ({
  siteId,
  onChange,
  selectedResourceId,
  onlyShowFolders,
  existingResource,
  resourceIds,
}: {
  siteId: number
  onChange: (resourceId: string) => void
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

  const isResourceIdHighlighted = useCallback(
    (resourceId: string): boolean => {
      const curResourceId = moveDest?.id
      return isResourceHighlighted && curResourceId === resourceId
    },
    [isResourceHighlighted, moveDest?.id],
  )

  const { data: nestedChildrenOfExistingResourceResult } =
    trpc.resource.getNestedFolderChildrenOf.useQuery({
      resourceId: String(existingResource?.id),
      siteId: String(siteId),
    })

  const nestedChildrenOfExistingResource = useMemo(
    (): ResourceItemContent[] =>
      nestedChildrenOfExistingResourceResult?.items ?? [],
    [nestedChildrenOfExistingResourceResult?.items],
  )

  const isResourceItemDisabled = useCallback(
    (resourceItem: ResourceItemContent): boolean => {
      // If there is no existing resource,
      // Then we are linking the resource and not moving any resource
      // Thus, no checks are needed because we can link to any resource
      if (!existingResource) return false

      // A resource should not be able to move to within itself
      if (existingResource.id === resourceItem.id) return true

      // If a resource is not allowed to have children then it is a page-ish resource
      // Thus, it can move to within any resource and no further checks are needed
      if (!isAllowedToHaveChildren(existingResource.type)) return false

      // A resource should not be able to move to its nested children
      return (
        nestedChildrenOfExistingResource.some(
          (child) => child.id === resourceItem.id,
        ) || false
      )
    },
    [existingResource, nestedChildrenOfExistingResource],
  )

  const hasParentInStack = useMemo(
    () =>
      (resourceStack.length === 1 && !isResourceHighlighted) ||
      resourceStack.length > 1,
    [resourceStack.length, isResourceHighlighted],
  )

  const fullPermalink: string = useMemo(() => {
    return resourceStack.map((resource) => resource.permalink).join("/")
  }, [resourceStack])

  const handleClickResourceItem = useCallback(
    (resourceItemWithAncestryStack: ResourceItemContent[]): void => {
      const lastChild = lastResourceItemInAncestryStack(
        resourceItemWithAncestryStack,
      )

      if (!lastChild) {
        throw new Error(
          "Unexpected undefined lastChild from lastResourceItemInAncestryStack",
        )
      }

      const isItemHighlighted = isResourceIdHighlighted(lastChild.id)
      const canClickIntoItem =
        lastChild.type === ResourceType.Folder ||
        lastChild.type === ResourceType.Collection

      if (isItemHighlighted && canClickIntoItem) {
        setIsResourceHighlighted(false)
        return
      }

      setResourceStack(resourceItemWithAncestryStack)
      onChange(lastChild.id)
      setIsResourceHighlighted(true)
    },
    [
      onChange,
      setIsResourceHighlighted,
      setResourceStack,
      isResourceIdHighlighted,
    ],
  )

  const handleClickBackButton = useCallback(() => {
    if (isResourceHighlighted) {
      setIsResourceHighlighted(false)
      removeFromStack(2)
    } else {
      removeFromStack(1)
    }
    const lastChild = lastResourceItemInAncestryStack(resourceStack)
    if (lastChild) {
      onChange(lastChild.id)
    }
  }, [isResourceHighlighted, onChange, removeFromStack, resourceStack])

  // currently do not support fetching next page for search
  return {
    fullPermalink,
    moveDest,
    resourceItemsWithAncestryStack,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    fetchNextPage: useResourceIdsFromSearch ? () => {} : fetchNextPage,
    hasNextPage: useResourceIdsFromSearch ? false : hasNextPage,
    isFetchingNextPage: useResourceIdsFromSearch ? false : isFetchingNextPage,
    isResourceIdHighlighted,
    isResourceItemDisabled,
    hasParentInStack,
    handleClickBackButton,
    handleClickResourceItem,
  }
}
