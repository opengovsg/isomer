import { Suspense } from "react"
import { Box, Flex, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { PendingMoveResource } from "~/features/editing-experience/types"
import { ResourceItem } from "./ResourceItem"
import { ResourceSelectorHeader } from "./ResourceSelectorHeader"
import { SearchBar } from "./SearchBar"
import { useResourceStack } from "./useResourceStack"

interface ResourceSelectorProps {
  onChange: (resourceId: string) => void
  selectedResourceId?: string
  existingResource?: PendingMoveResource
  onlyShowFolders?: boolean
}

const SuspensableResourceSelector = ({
  onChange,
  selectedResourceId,
  existingResource,
  onlyShowFolders = false,
}: ResourceSelectorProps) => {
  const {
    fullPermalink,
    isResourceHighlighted,
    setIsResourceHighlighted,
    moveDest,
    resourceItems,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    addToStack,
    removeFromStack,
    isResourceIdHighlighted,
    shouldShowBackButton,
    setSearchValue,
    searchQuery,
  } = useResourceStack({ onChange, selectedResourceId, onlyShowFolders })

  const isShowingSearchResults = !!searchQuery && searchQuery.length > 0

  return (
    <VStack gap="0.5rem" w="full">
      <SearchBar setSearchValue={setSearchValue} />
      <Box
        borderRadius="md"
        border="1px solid"
        borderColor="base.divider.strong"
        w="full"
        py="0.75rem"
        px="0.5rem"
        maxH="20rem"
        overflowY="auto"
      >
        <ResourceSelectorHeader
          shouldShowBackButton={shouldShowBackButton}
          handleBackButtonClick={() => {
            if (isResourceHighlighted) {
              setIsResourceHighlighted(false)
              removeFromStack(2)
            } else {
              removeFromStack(1)
            }
          }}
          isShowingSearchResults={isShowingSearchResults}
          resultsCount={resourceItems.length}
          searchQuery={searchQuery}
        />
        {resourceItems.map((item) => {
          const isHighlighted = isResourceIdHighlighted(item.id)
          const canClickIntoItem =
            item.type === ResourceType.Folder ||
            item.type === ResourceType.Collection
          return (
            <ResourceItem
              key={item.id}
              item={item}
              isDisabled={item.id === existingResource?.resourceId}
              isHighlighted={isHighlighted}
              handleOnClick={() => {
                if (isHighlighted && canClickIntoItem) {
                  setIsResourceHighlighted(false)
                  return
                }

                if (isResourceHighlighted) {
                  removeFromStack(1)
                } else {
                  setIsResourceHighlighted(true)
                }
                addToStack(item)
              }}
              hasAdditionalLeftPadding={!isShowingSearchResults}
            />
          )
        })}
        {hasNextPage && (
          <Button
            variant="link"
            pl="2.25rem"
            size="xs"
            isLoading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more
          </Button>
        )}
      </Box>
      {!!moveDest && (
        <Box bg="utility.feedback.info-subtle" p="0.75rem" w="full">
          <Flex flexDirection="column" gap="0.25rem">
            <Text textStyle="caption-1">You selected {fullPermalink}</Text>
            {existingResource && (
              <Text textStyle="caption-2">
                The URL for {existingResource.title} will change to{" "}
                {`${fullPermalink}/${existingResource.permalink}`}
              </Text>
            )}
          </Flex>
        </Box>
      )}
    </VStack>
  )
}

export const ResourceSelector = (props: ResourceSelectorProps) => {
  return (
    <Suspense fallback={<Skeleton h="4rem" />}>
      <SuspensableResourceSelector {...props} />
    </Suspense>
  )
}
