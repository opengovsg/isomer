import type { ResourceItemContent } from "~/schemas/resource"
import { useCallback, useEffect, useMemo, useState } from "react"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

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
  const [rootPage] = trpc.page.getRootPage.useSuspenseQuery({ siteId })

  const { data: pendingMovedItemAncestryStack } =
    trpc.resource.getAncestryStack.useQuery({
      siteId: String(siteId),
      resourceId: selectedResourceId ?? existingResource?.id,
      includeSelf: !!selectedResourceId,
    })

  // NOTE: getAncestryStack's underlying query excludes RootPage from its base
  // case, so it always resolves to an empty stack when selectedResourceId is
  // the homepage's own id. Special-case it here so reopening a homepage
  // selection still highlights "Home" instead of showing nothing selected.
  const isSelectedResourceHome = selectedResourceId === rootPage.id
  const homeAncestryItem: ResourceItemContent = {
    title: "Home",
    permalink: "",
    type: ResourceType.RootPage,
    id: rootPage.id,
    parentId: null,
  }

  // NOTE: This is the stack of user's navigation through the resource tree
  // NOTE: We should always start the stack from `/` (root)
  // so that the user will see a full overview of their site structure
  const [resourceStack, setResourceStack] = useState<ResourceItemContent[]>(
    isSelectedResourceHome
      ? [homeAncestryItem]
      : (pendingMovedItemAncestryStack ?? []),
  )

  useEffect(() => {
    return () => setResourceStack([])
  }, [])

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
    rootPage,
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
