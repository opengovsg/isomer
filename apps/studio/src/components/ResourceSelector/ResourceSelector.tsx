import { Suspense } from "react"
import {
  Box,
  Flex,
  HStack,
  Skeleton,
  Spacer,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Button, Link } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiHomeAlt, BiLeftArrowAlt } from "react-icons/bi"

import type { PendingMoveResource } from "~/features/editing-experience/types"
import { ResourceItem } from "./ResourceItem"
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
  } = useResourceStack({ onChange, selectedResourceId, onlyShowFolders })

  return (
    <VStack gap="0.5rem" w="full">
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
        {shouldShowBackButton ? (
          <Link
            variant="clear"
            w="full"
            justifyContent="flex-start"
            color="base.content.default"
            onClick={() => {
              if (isResourceHighlighted) {
                setIsResourceHighlighted(false)
                removeFromStack(2)
              } else {
                removeFromStack(1)
              }
            }}
            as="button"
          >
            <HStack spacing="0.25rem" color="interaction.links.default">
              <BiLeftArrowAlt />
              <Text textStyle="caption-1">Back to parent folder</Text>
            </HStack>
          </Link>
        ) : (
          <Flex
            w="full"
            px="0.75rem"
            py="0.375rem"
            color="base.content.default"
            alignItems="center"
          >
            <HStack spacing="0.25rem">
              <BiHomeAlt />
              <Text textStyle="caption-1">/</Text>
            </HStack>
            <Spacer />
            <Text
              color="base.content.medium"
              textTransform="uppercase"
              textStyle="caption-1"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              Home
            </Text>
          </Flex>
        )}
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
