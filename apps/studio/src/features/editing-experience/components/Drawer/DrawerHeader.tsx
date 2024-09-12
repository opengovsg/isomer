import { Flex, IconButton, Text } from "@chakra-ui/react"
import { BiChevronLeft } from "react-icons/bi"

interface DrawerHeaderProps {
  label: string
  onBackClick: () => void
  isDisabled: boolean
}

export const DrawerHeader = ({
  onBackClick,
  label,
  isDisabled,
}: DrawerHeaderProps): JSX.Element => {
  return (
    <Flex
      w="full"
      py="0.75rem"
      px="1.5rem"
      gap="0.25rem"
      alignItems="center"
      borderBottom="1px solid"
      borderColor="base.divider.medium"
      bg="white"
    >
      <IconButton
        colorScheme="sub"
        icon={<BiChevronLeft fontSize="1.25rem" />}
        variant="clear"
        size="sm"
        aria-label="Return to previous step"
        isDisabled={isDisabled}
        onClick={onBackClick}
      />
      <Text textStyle="h6">{label}</Text>
    </Flex>
  )
}
