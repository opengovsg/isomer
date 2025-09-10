import type { IconType } from "react-icons"
import { HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { BiCheck } from "react-icons/bi"

export const PublishModeCard = ({
  icon,
  title,
  description,
  isSelected,
  onSelect,
}: {
  icon: IconType
  title: string
  description: string
  isSelected: boolean
  onSelect: () => void
}) => {
  return (
    <HStack
      display="flex"
      alignItems="flex-start"
      border="1px"
      borderColor={isSelected ? "base.divider.brand" : "base.divider.medium"}
      boxShadow={isSelected ? "sm" : undefined}
      padding="0.75rem"
      spacing="0.5rem"
      cursor="pointer"
      borderRadius="md"
      onClick={onSelect}
    >
      <Icon
        as={icon}
        boxSize="1.5rem"
        py="0.125rem"
        color={isSelected ? "base.content.brand" : "base.content.strong"}
      />
      <VStack align="stretch" spacing={0}>
        <HStack display="flex" spacing="0" alignItems="center">
          <Text
            textStyle="subhead-2"
            color={isSelected ? "base.content.brand" : "base.content.strong"}
          >
            {title}
          </Text>
          {isSelected && (
            <Icon
              as={BiCheck}
              boxSize="1rem"
              color="utility.feedback.success"
            />
          )}
        </HStack>
        <Text textStyle="body-2">{description}</Text>
      </VStack>
    </HStack>
  )
}
