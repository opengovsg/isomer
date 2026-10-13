import type { TextProps } from "@chakra-ui/react"
import { Flex, IconButton, Stack, Text } from "@chakra-ui/react"
import { BiChevronLeft } from "react-icons/bi"

interface DrawerHeaderProps extends TextProps {
  label: string
  // Shown under the label, e.g. where a nested block sits in its parent.
  description?: string
  onBackClick: () => void
  isDisabled?: boolean
  backAriaLabel?: string
}

export const DrawerHeader = ({
  onBackClick,
  label,
  description,
  isDisabled,
  backAriaLabel,
  ...textProps
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
        aria-label={backAriaLabel ?? "Return to previous step"}
        isDisabled={isDisabled}
        onClick={onBackClick}
      />
      <Stack gap={0}>
        <Text textStyle="h6" {...textProps}>
          {label}
        </Text>
        {description && (
          <Text textStyle="caption-2" color="base.content.medium">
            {description}
          </Text>
        )}
      </Stack>
    </Flex>
  )
}
