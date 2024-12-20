import { useCallback, useMemo } from "react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ResourceItemContent } from "~/schemas/resource"
import { isAllowedToHaveChildren } from "~/utils/resources"
import { trpc } from "~/utils/trpc"
import { lastResourceItemInAncestryStack } from "./utils"

export const useResourceSelector = ({
  siteId,
  moveDest,
  resourceStack,
  isResourceHighlighted,
  setIsResourceHighlighted,
  existingResource,
  setResourceStack,
  removeFromStack,
  onChange,
}: {
  siteId: number
  moveDest: ResourceItemContent | undefined
  resourceStack: ResourceItemContent[]
  isResourceHighlighted: boolean
  setIsResourceHighlighted: (isResourceHighlighted: boolean) => void
  existingResource: ResourceItemContent | undefined
  setResourceStack: (resourceStack: ResourceItemContent[]) => void
  removeFromStack: (numberOfResources: number) => void
  onChange: (resourceId: string) => void
}) => {
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
  }, [
    isResourceHighlighted,
    onChange,
    removeFromStack,
    resourceStack,
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
