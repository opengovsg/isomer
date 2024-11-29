import { Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { PendingMoveResource } from "~/features/editing-experience/types"
import type { ResourceItemContent } from "~/schemas/resource"
import { ResourceItem } from "./ResourceItem"

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
    <ResourceItem
      key={`loading-${index}`}
      item={{
        id: `loading-${index}`,
        title: `Loading...`,
        type: ResourceType.Folder,
        permalink: "",
      }}
      isLoading={true}
    />
  ))
}

export const ResourceItemsResults = ({
  resourceItems,
  isResourceIdHighlighted,
  existingResource,
  hasAdditionalLeftPadding,
  resourceItemHandleClick,
}: {
  resourceItems: ResourceItemContent[]
  isResourceIdHighlighted: (resourceId: string) => boolean
  existingResource: PendingMoveResource | undefined
  hasAdditionalLeftPadding: boolean
  resourceItemHandleClick: (item: ResourceItemContent) => void
}) => {
  return resourceItems.map((item) => {
    return (
      <ResourceItem
        key={item.id}
        item={item}
        isDisabled={item.id === existingResource?.resourceId}
        isHighlighted={isResourceIdHighlighted(item.id)}
        handleOnClick={() => resourceItemHandleClick(item)}
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
