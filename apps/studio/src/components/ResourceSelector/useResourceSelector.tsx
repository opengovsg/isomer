import { useCallback, useMemo } from "react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ResourceItemContent } from "~/schemas/resource"
import { isAllowedToHaveChildren } from "~/utils/resources"
import { trpc } from "~/utils/trpc"
import { lastResourceItemInAncestryStack } from "./utils"

interface UseResourceSelectorProps {
  interactionType: "move" | "link"
  siteId: number
  moveDest: ResourceItemContent | undefined
  resourceStack: ResourceItemContent[]
  isResourceHighlighted: boolean
  setIsResourceHighlighted: (isResourceHighlighted: boolean) => void
  existingResource: ResourceItemContent | undefined
  setResourceStack: (resourceStack: ResourceItemContent[]) => void
  removeFromStack: (numberOfResources: number) => ResourceItemContent[]
  onChange: (resourceId: string) => void
}

export const useResourceSelector = ({
  interactionType,
  siteId,
  moveDest,
  resourceStack,
  isResourceHighlighted,
  setIsResourceHighlighted,
  existingResource,
  setResourceStack,
  removeFromStack,
  onChange,
}: UseResourceSelectorProps) => {
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
      if (!existingResource) return false

      // Then we are linking the resource and not moving any resource
      // Thus, no checks are needed because we can link to any resource
      if (interactionType === "link") return false

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
    [existingResource, interactionType, nestedChildrenOfExistingResource],
  )

  const hasParentInStack = useMemo(
    () =>
      (resourceStack.length === 1 && !isResourceHighlighted) ||
      resourceStack.length > 1,
    [resourceStack.length, isResourceHighlighted],
  )

  const handleClickBackButton = useCallback(() => {
    let lastChild: ResourceItemContent | undefined

    if (isResourceHighlighted) {
      setIsResourceHighlighted(false)
      const updatedStack = removeFromStack(2)
      lastChild = lastResourceItemInAncestryStack(updatedStack)
    } else {
      const updatedStack = removeFromStack(1)
      lastChild = lastResourceItemInAncestryStack(updatedStack)
    }

    if (lastChild) {
      onChange(lastChild.id)
    }
  }, [
    isResourceHighlighted,
    onChange,
    removeFromStack,
    setIsResourceHighlighted,
  ])

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

  return {
    isResourceIdHighlighted,
    isResourceItemDisabled,
    hasParentInStack,
    handleClickBackButton,
    handleClickResourceItem,
  }
}
