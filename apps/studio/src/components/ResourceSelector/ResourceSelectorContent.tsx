import { Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import type { ResourceItemContent } from "~/schemas/resource"
import { ResourceItem, ResourceItemSkeleton } from "./ResourceItem"
import { lastResourceItemInAncestryStack } from "./utils"

const NoItemsInFolderResult = () => {
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

const ResourceItemsResults = ({
  resourceItemsWithAncestryStack,
  isResourceIdHighlighted,
  isResourceItemDisabled,
  hasAdditionalLeftPadding,
  handleClickResourceItem,
}: Pick<
  SuspendableContentProps,
  | "resourceItemsWithAncestryStack"
  | "isResourceIdHighlighted"
  | "isResourceItemDisabled"
  | "hasAdditionalLeftPadding"
  | "handleClickResourceItem"
>) => {
  return resourceItemsWithAncestryStack.map((resourceItemWithAncestryStack) => {
    const lastChild = lastResourceItemInAncestryStack(
      resourceItemWithAncestryStack,
    )

    if (!lastChild) {
      throw new Error(
        "Unexpected undefined lastChild from lastResourceItemInAncestryStack",
      )
    }

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

const ZeroResult = ({
  searchQuery,
  handleClickClearSearch,
}: Pick<SuspendableContentProps, "searchQuery"> & {
  handleClickClearSearch: SuspendableContentProps["clearSearchValue"]
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

export const LoadingResourceItemsResults = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <ResourceItemSkeleton key={`loading-${index}`} />
  ))
}

interface SuspendableContentProps {
  resourceItemsWithAncestryStack: ResourceItemContent[][] | undefined
  isResourceIdHighlighted: (resourceId: string) => boolean
  isResourceItemDisabled: (resourceItem: ResourceItemContent) => boolean
  hasAdditionalLeftPadding: boolean
  handleClickResourceItem: (
    resourceItemWithAncestryStack: ResourceItemContent[],
  ) => void
  isSearchQueryEmpty: boolean
  searchQuery: string
  clearSearchValue: () => void
  isLoading: boolean
}
export const SuspendableContent = ({
  resourceItemsWithAncestryStack,
  isResourceIdHighlighted,
  isResourceItemDisabled,
  hasAdditionalLeftPadding,
  handleClickResourceItem,
  isSearchQueryEmpty,
  searchQuery,
  clearSearchValue,
  isLoading,
}: SuspendableContentProps) => {
  if (isLoading) return <LoadingResourceItemsResults />

  const hasNoItems = resourceItemsWithAncestryStack.length === 0

  if (hasNoItems && isSearchQueryEmpty) return <NoItemsInFolderResult />

  if (hasNoItems)
    return (
      <ZeroResult
        searchQuery={searchQuery}
        handleClickClearSearch={clearSearchValue}
      />
    )

  return (
    <ResourceItemsResults
      resourceItemsWithAncestryStack={resourceItemsWithAncestryStack}
      isResourceIdHighlighted={isResourceIdHighlighted}
      isResourceItemDisabled={isResourceItemDisabled}
      hasAdditionalLeftPadding={hasAdditionalLeftPadding}
      handleClickResourceItem={handleClickResourceItem}
    />
  )
}
