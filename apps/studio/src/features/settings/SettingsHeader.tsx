import { Center, Flex, Icon, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { IconType } from "react-icons"

interface SettingsHeaderProps {
  title: string
  icon: IconType
  isLoading?: boolean
}
export const SettingsHeader = ({
  title,
  icon,
  isLoading,
}: SettingsHeaderProps) => {
  return (
    <Flex justifyContent="space-between" w="100%">
      <Flex align="center">
        <Center
          w="2rem"
          h="2rem"
          bgColor="brand.secondary.100"
          borderRadius="6px"
          mr="0.75rem"
          alignItems="center"
          justifyItems="center"
        >
          <Icon as={icon} boxSize="1rem" />
        </Center>
        <Text as="h1" textStyle="h3">
          {title}
        </Text>
      </Flex>
      <Button type="submit" isLoading={isLoading}>
        Publish changes
      </Button>
    </Flex>
  )
}
