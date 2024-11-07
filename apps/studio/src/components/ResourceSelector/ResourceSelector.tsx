import { Suspense, useState } from "react"
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
import { ResourceType } from "@prisma/client"
import { BiHomeAlt, BiLeftArrowAlt } from "react-icons/bi"

import type { PendingMoveResource } from "~/features/editing-experience/types"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { trpc } from "~/utils/trpc"
import { ResourceItem } from "./ResourceItem"

interface ResourceSelectorProps {
  selectedResourceId?: string
  onChange: (resourceId: string) => void
}

const SuspensableResourceSelector = ({
  selectedResourceId,
  onChange,
}: ResourceSelectorProps) => {
  // NOTE: This is the stack of user's navigation through the resource tree
  // NOTE: We should always start the stack from `/` (root)
  // so that the user will see a full overview of their site structure
  const [resourceStack, setResourceStack] = useState<PendingMoveResource[]>([])
  const [isResourceHighlighted, setIsResourceHighlighted] =
    useState<boolean>(true)
  const { siteId } = useQueryParse(sitePageSchema)

  const moveDest = resourceStack[resourceStack.length - 1]
  const parentDest = resourceStack[resourceStack.length - 2]
  const curResourceId = moveDest?.resourceId
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.resource.getChildrenOf.useInfiniteQuery(
      {
        resourceId:
          (isResourceHighlighted
            ? parentDest?.resourceId
            : moveDest?.resourceId) ?? null,
        siteId: String(siteId),
        limit: 25,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextOffset,
      },
    )
  const shouldShowBackButton: boolean =
    (resourceStack.length === 1 && !isResourceHighlighted) ||
    resourceStack.length > 1

  return (
    <VStack alignItems="flex-start">
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
                setResourceStack((prev) => prev.slice(0, -2))
              } else {
                setResourceStack((prev) => prev.slice(0, -1))
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

        {data?.pages.map(({ items }) =>
          items.map((item) => {
            const isItemHighlighted: boolean =
              isResourceHighlighted && item.id === curResourceId

            const canClickIntoItem: boolean =
              item.type === ResourceType.Folder ||
              item.type === ResourceType.Collection

            return (
              <ResourceItem
                {...item}
                key={item.id}
                isDisabled={false}
                isHighlighted={isItemHighlighted}
                handleOnClick={() => {
                  if (isItemHighlighted) {
                    if (canClickIntoItem) {
                      setIsResourceHighlighted(false)
                    }
                    return
                  }

                  const newResource = {
                    ...item,
                    parentId: parentDest?.resourceId ?? null,
                    resourceId: item.id,
                  }
                  if (isResourceHighlighted) {
                    setResourceStack((prev) => [
                      ...prev.slice(0, -1),
                      newResource,
                    ])
                  } else {
                    setIsResourceHighlighted(true)
                    setResourceStack((prev) => [...prev, newResource])
                  }
                }}
              />
            )
          }),
        )}
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
          <Text textStyle="caption-1">You selected /{moveDest.permalink}</Text>
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
