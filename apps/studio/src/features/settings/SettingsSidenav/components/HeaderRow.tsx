import { HStack, Icon, Text } from "@chakra-ui/react"
import { IconType } from "react-icons"

interface HeaderRowProps {
  label: string
  icon: IconType
}

export const HeaderRow = ({ label, icon }: HeaderRowProps) => {
  return (
    <HStack gap="0.5rem" display="flex" alignItems="center">
      <Icon fill="base.content.medium" as={icon} boxSize="1rem" />
      <Text textColor="base.content.medium" textStyle="body-2">
        {label}
      </Text>
    </HStack>
  )
}
