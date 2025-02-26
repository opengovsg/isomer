import { HStack, Icon, Text } from "@chakra-ui/react"
import { BiCheck, BiX } from "react-icons/bi"

import type { ROLES_LABELS } from "./constants"

interface ContentItemProps {
  text: (typeof ROLES_LABELS)[number]
}

export const HavePermissionContentItem = ({ text }: ContentItemProps) => {
  return (
    <HStack gap={1} w="100%">
      <Icon as={BiCheck} color="green.500" size={4} />
      <Text textStyle="caption-1">{text}</Text>
    </HStack>
  )
}

export const NoPermissionContentItem = ({ text }: ContentItemProps) => {
  return (
    <HStack gap={1} w="100%">
      <Icon as={BiX} color="gray.400" size={4} />
      <Text textStyle="caption-2" color="interaction.support.disabled-content">
        {text}
      </Text>
    </HStack>
  )
}
