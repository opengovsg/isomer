import { Suspense, useState } from "react"
import {
  Box,
  Flex,
  HStack,
  Icon,
  Skeleton,
  Spacer,
  Text,
} from "@chakra-ui/react"
import { Button, Link } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiHomeAlt, BiLeftArrowAlt } from "react-icons/bi"

import { trpc } from "~/utils/trpc"
import { ResourceItem } from "./ResourceItem"

const SuspensableResourceSelector = ({
  siteId,
  selectedResourceId,
  onChange,
  isDisabledFn,
}: ResourceSelectorProps) => {
  const [ancestryStack] = trpc.resource.getAncestryOf.useSuspenseQuery({
    siteId,
    resourceId: selectedResourceId,
  })
  const [parentIdStack, setParentIdStack] = useState<string[]>(
    ancestryStack.map((item) => item.id),
  )
  const currResourceId = parentIdStack[parentIdStack.length - 1] ?? null

  const [data, { fetchNextPage, hasNextPage, isFetchingNextPage }] =
    trpc.resource.getChildrenOf.useSuspenseInfiniteQuery(
      {
        resourceId: currResourceId,
        siteId,
        limit: 25,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextOffset,
      },
    )

  const onBack = () => {
    setParentIdStack((prev) => prev.slice(0, -1))
  }

  return (
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
      {parentIdStack.length > 0 ? (
        <Link
          variant="clear"
          w="full"
          justifyContent="flex-start"
          color="base.content.default"
          onClick={onBack}
          as="button"
        >
          <HStack spacing="0.25rem" color="interaction.links.default">
            <Icon as={BiLeftArrowAlt} />
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
          <HStack spacing="0.5rem">
            <Icon as={BiHomeAlt} />
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

      {data.pages.flatMap(({ items }) => items).length === 0 ? (
        <Box py="0.5rem" pl="2.25rem">
          <Text textStyle="caption-2" fontStyle="italic">
            No matching results
          </Text>
        </Box>
      ) : (
        data.pages.map(({ items }) =>
          items.map((child) => {
            const isDisabled = isDisabledFn?.(child.id) ?? false

            return (
              <ResourceItem
                {...child}
                key={child.id}
                isSelected={selectedResourceId === child.id}
                isDisabled={isDisabled}
                onResourceItemSelect={() => {
                  if (
                    child.type === ResourceType.Folder ||
                    child.type === ResourceType.Collection
                  ) {
                    setParentIdStack((prev) => [...prev, child.id])
                  } else {
                    onChange(child.id)
                  }
                }}
              />
            )
          }),
        )
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
  )
}

interface ResourceSelectorProps {
  siteId: string
  selectedResourceId?: string
  onChange: (resourceId: string) => void
  isDisabledFn?: (resourceId: string) => boolean
}

export const ResourceSelector = (props: ResourceSelectorProps) => {
  return (
    <Suspense fallback={<Skeleton h="4rem" />}>
      <SuspensableResourceSelector {...props} />
    </Suspense>
  )
}
