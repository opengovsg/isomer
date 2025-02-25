import { useCallback, useMemo, useState } from "react"

import type { ResourceItemContent } from "~/schemas/resource"
import { trpc } from "~/utils/trpc"

interface UseResourceStackProps {
  siteId: number
  selectedResourceId: string | undefined
  existingResource: ResourceItemContent | undefined
}

export const useResourceStack = ({
  siteId,
  selectedResourceId,
  existingResource,
}: UseResourceStackProps) => {
  const { data: pendingMovedItemAncestryStack } =
    trpc.resource.getAncestryStack.useQuery({
      siteId: String(siteId),
      resourceId: selectedResourceId ?? existingResource?.id,
      includeSelf: !!selectedResourceId,
    })

  // NOTE: This is the stack of user's navigation through the resource tree
  // NOTE: We should always start the stack from `/` (root)
  // so that the user will see a full overview of their site structure
  const [resourceStack, setResourceStack] = useState<ResourceItemContent[]>(
    pendingMovedItemAncestryStack ?? [],
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

  const removeFromStack = useCallback(
    (numberOfResources: number): ResourceItemContent[] => {
      let updatedStack: ResourceItemContent[] = []
      setResourceStack((prev) => {
        updatedStack = prev.slice(0, -numberOfResources)
        return updatedStack
      })
      return updatedStack
    },
    [],
  )

  const fullPermalink = useMemo(() => {
    return resourceStack.map((resource) => resource.permalink).join("/")
  }, [resourceStack])

  const moveDestPermalink = useMemo(() => {
    const resourcesForPath = [...resourceStack]

    if (existingResource) {
      resourcesForPath.push(existingResource)
    }

    return resourcesForPath.map((resource) => resource.permalink).join("/")
  }, [resourceStack, existingResource])

  // currently do not support fetching next page for search
  return {
    fullPermalink,
    moveDestPermalink,
    moveDest,
    parentDest,
    resourceStack,
    isResourceHighlighted,
    setIsResourceHighlighted,
    setResourceStack,
    removeFromStack,
  }
}
