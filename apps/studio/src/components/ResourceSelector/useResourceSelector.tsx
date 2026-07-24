import type { ResourceItemContent } from "~/schemas/resource"
import { useCallback, useMemo } from "react"
import { isAllowedToHaveChildren } from "~/utils/resources"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

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
  // fullPermalink is the selected resource's path (no leading slash), built from
  // the just-updated stack so it never lags a render behind resourceId.
  onChange: (resourceId: string | null, fullPermalink: string) => void
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

  const getResourceItemDisabledReason = useCallback(
    (resourceItem: ResourceItemContent): string | undefined => {
      if (!existingResource) return undefined

      // Then we are linking the resource and not moving any resource
      // Thus, no checks are needed because we can link to any resource
      if (interactionType === "link") return undefined

      // A resource should not be able to move to within itself
      if (existingResource.id === resourceItem.id) {
        return "This item cannot be moved into itself."
      }

      // A resource should not be able to move to its current parent
      if (existingResource.parentId === resourceItem.id) {
        return `This item is already in this ${resourceItem.type === ResourceType.Collection ? "collection" : "folder"}.`
      }

      // If a resource is not allowed to have children then it is a page-ish resource
      // Thus, it can move to within any resource and no further checks are needed
      if (!isAllowedToHaveChildren(existingResource.type)) return undefined

      // A resource should not be able to move to its nested children
      if (
        nestedChildrenOfExistingResource.some(
          (child) => child.id === resourceItem.id,
        )
      ) {
        return "This folder cannot be moved into one of its subfolders."
      }

      return undefined
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
    let updatedStack: ResourceItemContent[]

    if (isResourceHighlighted) {
      setIsResourceHighlighted(false)
      updatedStack = removeFromStack(2)
    } else {
      updatedStack = removeFromStack(1)
    }

    const lastChild = lastResourceItemInAncestryStack(updatedStack)
    onChange(
      lastChild?.id ?? null,
      updatedStack.map((resource) => resource.permalink).join("/"),
    )
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
      onChange(
        lastChild.id,
        resourceItemWithAncestryStack
          .map((resource) => resource.permalink)
          .join("/"),
      )
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
    getResourceItemDisabledReason,
    hasParentInStack,
    handleClickBackButton,
    handleClickResourceItem,
  }
}
