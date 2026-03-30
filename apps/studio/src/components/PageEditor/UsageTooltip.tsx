import type { PropsWithChildren } from "react"
import Image from "next/image"
import {
  Flex,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from "@chakra-ui/react"
import { type IconType } from "react-icons"

export interface ResourceTooltipProps extends PropsWithChildren {
  imageSrc?: string
  icon: IconType
  label: string
  description: string
  usageText?: string
}
export const ResourceTooltip = ({
  children,
  imageSrc,
  icon,
  label,
  description,
  usageText,
}: ResourceTooltipProps) => {
  return (
    <Popover trigger="hover" placement="right" isLazy offset={[0, 20]}>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent width="fit-content" overflow="hidden">
        <Flex flexDir="column" w="292px">
          {imageSrc && (
            <Image height={160} width={292} src={imageSrc} alt={label} />
          )}
          <VStack
            py="1rem"
            px="1.125rem"
            alignItems="start"
            gap="0.75rem"
            borderTop={imageSrc ? "1px solid" : undefined}
            borderColor="base.divider.medium"
          >
            <Flex alignItems="center" gap="0.25rem" w="full">
              <Icon as={icon} size="1.25rem" />
              <Text textStyle="subhead-2">{label}</Text>
            </Flex>
            <Text textStyle="body-2">{usageText ?? description}</Text>
          </VStack>
        </Flex>
      </PopoverContent>
    </Popover>
  )
}
