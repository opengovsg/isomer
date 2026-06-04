import type { ComponentProps } from "react"
import type { ResourceItemContent } from "~/schemas/resource"
import { Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { dataAttr } from "@chakra-ui/utils"
import { Button } from "@opengovsg/oui"
import { cn } from "@opengovsg/oui-theme"
import { getIcon } from "~/utils/resources"

interface ResourceItemProps {
  item: ResourceItemContent
  isDisabled?: boolean
  isHighlighted?: boolean
  handleOnClick?: () => void
  hasAdditionalLeftPadding?: boolean
  isLoading?: boolean
}

const ResourceItemContainer = ({
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "className"> & {
  className?: string
}) => {
  return (
    <Button
      variant="clear"
      className={cn(
        "text-base-content-default h-fit w-full items-start justify-start gap-1",
        className,
      )}
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
      className={cn(
        "data-[selected]:bg-interaction-muted-main-active data-[selected]:text-interaction-main-default data-[selected]:hover:bg-interaction-muted-main-active data-[selected]:hover:text-interaction-main-default",
        hasAdditionalLeftPadding && "pl-9",
      )}
      onPress={handleOnClick}
      startContent={<Icon as={getIcon(item.type)} />}
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
