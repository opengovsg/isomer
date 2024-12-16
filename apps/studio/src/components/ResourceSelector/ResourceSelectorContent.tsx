import { Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import type { ResourceItemContent } from "~/schemas/resource"
import { ResourceItem, ResourceItemSkeleton } from "./ResourceItem"
import { lastResourceItemInAncestryStack } from "./utils"

export const NoItemsInFolderResult = () => {
  return (
    <Text
      h="full"
      w="full"
      textAlign="center"
      textStyle="caption-2"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      This folder is empty.
    </Text>
  )
}

export const LoadingResourceItemsResults = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <ResourceItemSkeleton key={`loading-${index}`} />
  ))
}

export const ResourceItemsResults = ({
  resourceItemsWithAncestryStack,
  isResourceIdHighlighted,
  isResourceItemDisabled,
  hasAdditionalLeftPadding,
  handleClickResourceItem,
}: {
  resourceItemsWithAncestryStack: ResourceItemContent[][]
  isResourceIdHighlighted: (resourceId: string) => boolean
  isResourceItemDisabled: (resourceItem: ResourceItemContent) => boolean
  hasAdditionalLeftPadding: boolean
  handleClickResourceItem: (
    resourceItemWithAncestryStack: ResourceItemContent[],
  ) => void
}) => {
  return resourceItemsWithAncestryStack.map((resourceItemWithAncestryStack) => {
    const lastChild: ResourceItemContent | undefined =
      lastResourceItemInAncestryStack(resourceItemWithAncestryStack)

    // this should never happen. only added here to satisfy typescript
    if (!lastChild) return

    return (
      <ResourceItem
        key={lastChild.id}
        item={lastChild}
        isDisabled={isResourceItemDisabled(lastChild)}
        isHighlighted={isResourceIdHighlighted(lastChild.id)}
        handleOnClick={() =>
          handleClickResourceItem(resourceItemWithAncestryStack)
        }
        hasAdditionalLeftPadding={hasAdditionalLeftPadding}
      />
    )
  })
}

export const ZeroResult = ({
  searchQuery,
  handleClickClearSearch,
}: {
  searchQuery: string
  handleClickClearSearch: () => void
}) => {
  return (
    <VStack
      h="full"
      w="full"
      alignItems="center"
      justifyContent="center"
      gap="0.75rem"
    >
      <VStack
        w="full"
        alignItems="center"
        justifyContent="center"
        gap="0.25rem"
      >
        <Text textStyle="subhead-2" textAlign="center">
          We can't find anything with
          <br />"{searchQuery}" in title
        </Text>
        <Text textStyle="caption-2">Try searching for something else.</Text>
      </VStack>
      <Button variant="link" size="xs" onClick={handleClickClearSearch}>
        <Text textStyle="caption-2">Clear search</Text>
      </Button>
    </VStack>
  )
}
