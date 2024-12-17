import { Suspense, useMemo } from "react"
import { Box, Flex, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ResourceItemContent } from "~/schemas/resource"
import { useSearchQuery } from "~/hooks/useSearchQuery"
import { getUserViewableResourceTypes } from "~/utils/resources"
import {
  LoadingResourceItemsResults,
  SuspendableContent,
} from "./ResourceSelectorContent"
import { LoadingHeader, SuspendableHeader } from "./ResourceSelectorHeader"
import { SearchBar } from "./SearchBar"
import { useResourceStack } from "./useResourceStack"

const FILE_EXPLORER_DEFAULT_HEIGHT_IN_REM = 17.5

interface ResourceSelectorProps {
  siteId: number
  onChange: (resourceId: string) => void
  selectedResourceId?: string
  existingResource?: ResourceItemContent
  onlyShowFolders?: boolean
  fileExplorerHeight?: number
}

const SuspensableResourceSelector = ({
  siteId,
  onChange,
  selectedResourceId,
  existingResource,
  onlyShowFolders = false,
  fileExplorerHeight = FILE_EXPLORER_DEFAULT_HEIGHT_IN_REM,
}: ResourceSelectorProps) => {
  const {
    searchValue,
    setSearchValue,
    debouncedSearchTerm: searchQuery,
    isLoading,
    matchedResources,
    clearSearchValue,
  } = useSearchQuery({
    siteId: String(siteId),
    resourceTypes: onlyShowFolders
      ? [ResourceType.Folder]
      : getUserViewableResourceTypes(),
  })

  const isSearchQueryEmpty: boolean = searchQuery.trim().length === 0
  const hasAdditionalLeftPadding: boolean = isSearchQueryEmpty

  const {
    fullPermalink,
    moveDest,
    resourceItemsWithAncestryStack,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isResourceIdHighlighted,
    isResourceItemDisabled,
    hasParentInStack,
    handleClickBackButton,
    handleClickResourceItem,
  } = useResourceStack({
    siteId,
    onChange: (resourceId: string) => {
      onChange(resourceId)
      clearSearchValue()
    },
    selectedResourceId,
    onlyShowFolders,
    existingResource,
    resourceIds: isSearchQueryEmpty
      ? undefined
      : matchedResources.map((resource) => resource.id),
  })

  const renderedHeader = useMemo(() => {
    return (
      <Suspense fallback={<LoadingHeader />}>
        <SuspendableHeader
          isSearchQueryEmpty={isSearchQueryEmpty}
          hasParentInStack={hasParentInStack}
          handleClickBackButton={handleClickBackButton}
          resourceItemsWithAncestryStack={resourceItemsWithAncestryStack}
          searchQuery={searchQuery}
          isLoading={isLoading}
        />
      </Suspense>
    )
  }, [
    isSearchQueryEmpty,
    hasParentInStack,
    handleClickBackButton,
    resourceItemsWithAncestryStack,
    searchQuery,
    isLoading,
  ])

  const renderedContent = useMemo(() => {
    return (
      <Suspense fallback={<LoadingResourceItemsResults />}>
        <SuspendableContent
          resourceItemsWithAncestryStack={resourceItemsWithAncestryStack}
          isResourceIdHighlighted={isResourceIdHighlighted}
          isResourceItemDisabled={isResourceItemDisabled}
          hasAdditionalLeftPadding={hasAdditionalLeftPadding}
          handleClickResourceItem={handleClickResourceItem}
          isSearchQueryEmpty={isSearchQueryEmpty}
          searchQuery={searchQuery}
          clearSearchValue={clearSearchValue}
          isLoading={isLoading}
        />
      </Suspense>
    )
  }, [
    resourceItemsWithAncestryStack,
    isResourceIdHighlighted,
    isResourceItemDisabled,
    hasAdditionalLeftPadding,
    handleClickResourceItem,
    isSearchQueryEmpty,
    searchQuery,
    clearSearchValue,
    isLoading,
  ])

  return (
    <VStack gap="0.5rem" w="full">
      <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} />
      <Box
        borderRadius="md"
        border="1px solid"
        borderColor="base.divider.strong"
        w="full"
        py="0.75rem"
        px="0.5rem"
        h={`${fileExplorerHeight}rem`}
        overflowY="auto"
        display="flex"
        flexDirection="column"
        gap="0.25rem"
      >
        {renderedHeader}
        {renderedContent}
        {hasNextPage && (
          <Button
            variant="link"
            py="0.5rem"
            pl={hasAdditionalLeftPadding ? "2.25rem" : "1rem"}
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
    <Suspense
      fallback={
        <Skeleton
          w="full"
          h={`${props.fileExplorerHeight ?? FILE_EXPLORER_DEFAULT_HEIGHT_IN_REM + 4.25}rem`}
        />
      }
    >
      <SuspensableResourceSelector {...props} />
    </Suspense>
  )
}
