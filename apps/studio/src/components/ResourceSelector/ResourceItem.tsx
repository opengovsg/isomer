import type { ButtonProps } from "@opengovsg/design-system-react"
import { Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { dataAttr } from "@chakra-ui/utils"
import { Button } from "@opengovsg/design-system-react"

import type { ResourceItemContent } from "~/schemas/resource"
import { getIcon } from "~/utils/resources"

interface ResourceItemProps {
  item: ResourceItemContent
  isDisabled?: boolean
  isHighlighted?: boolean
  handleOnClick?: () => void
  hasAdditionalLeftPadding?: boolean
  isLoading?: boolean
}

const ResourceItemContainer = (props: ButtonProps) => {
  return (
    <Button
      variant="clear"
      w="full"
      justifyContent="flex-start"
      color={"base.content.default"}
      height="fit-content"
      alignItems="flex-start"
      gap="0.25rem"
      {...props}
    />
  )
}

export const ResourceItemSkeleton = () => {
  return (
    <ResourceItemContainer isDisabled>
      <VStack alignItems="flex-start" textAlign="left" gap="0.25rem">
        <Skeleton width="12rem" height="1.125rem" variant="pulse" />
        <Skeleton width="18rem" height="1.125rem" variant="pulse" />
      </VStack>
    </ResourceItemContainer>
  )
}

export const ResourceItem = ({
  item,
  isDisabled,
  isHighlighted = false,
  handleOnClick,
  hasAdditionalLeftPadding = false,
}: ResourceItemProps) => {
  return (
    <ResourceItemContainer
      data-selected={dataAttr(isHighlighted)}
      _selected={{
        color: "interaction.main.default",
        bg: "interaction.muted.main.active",
        _hover: {
          color: "interaction.main.default",
          bg: "interaction.muted.main.active",
        },
      }}
      {...(hasAdditionalLeftPadding && { pl: "2.25rem" })}
      onClick={handleOnClick}
      leftIcon={<Icon as={getIcon(item.type)} />}
      isDisabled={isDisabled}
    >
      <VStack alignItems="flex-start" textAlign="left" gap="0.25rem">
        <Text noOfLines={1} textStyle="caption-1">
          {item.title}
        </Text>
        <Text noOfLines={1} textStyle="caption-2">
          {`/${item.permalink}`}
        </Text>
      </VStack>
    </ResourceItemContainer>
  )
}
