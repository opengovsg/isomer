import { useState } from "react"
import { Box, Flex, HStack, Icon, Spacer, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import { BiHomeAlt, BiLeftArrowAlt } from "react-icons/bi"

import { trpc } from "~/utils/trpc"
import { ResourceItem } from "./ResourceItem"

interface ResourceSelectorProps {
  selectedResourceId?: string
  onChange: (resourceId: string) => void
  isDisabledFn?: (resourceId: string) => boolean
}

export const ResourceSelector = ({
  selectedResourceId,
  onChange,
  isDisabledFn,
}: ResourceSelectorProps) => {
  const [parentIdStack, setParentIdStack] = useState<string[]>([])
  const currResourceId = parentIdStack[parentIdStack.length - 1]
  const [children] = trpc.resource.getChildrenOf.useSuspenseQuery({
    resourceId: currResourceId ?? null,
  })

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

      {children.map((child) => {
        const isDisabled = isDisabledFn?.(child.id) ?? false

        return (
          <ResourceItem
            {...child}
            key={child.id}
            isSelected={selectedResourceId === child.id}
            isDisabled={isDisabled}
            onResourceItemSelect={() => {
              if (child.type === "Folder" || child.type === "Collection") {
                setParentIdStack((prev) => [...prev, child.id])
              } else {
                onChange(child.id)
              }
            }}
          />
        )
      })}
    </Box>
  )
}
