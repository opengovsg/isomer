import type { IconType } from "react-icons"
import { Flex, Icon, Stack, Text } from "@chakra-ui/react"

interface BaseBlockProps {
  onClick: () => void
  label: string
}

interface FixedBlockProps extends BaseBlockProps {
  description: string
  icon: IconType
}

export const FixedBlock = ({
  onClick,
  label,
  description,
  icon,
}: FixedBlockProps): JSX.Element => {
  return (
    <Stack
      as="button"
      onClick={onClick}
      layerStyle="focusRing"
      w="100%"
      borderRadius="6px"
      border="1px solid"
      borderColor="base.divider.medium"
      transitionProperty="common"
      transitionDuration="normal"
      _hover={{
        bg: "base.canvas.brand-subtle",
      }}
      bg="white"
      py="0.5rem"
      px="0.75rem"
      flexDirection="row"
      align="center"
    >
      <Flex p="0.25rem" bg="base.canvas.brand-subtle" borderRadius="4px">
        <Icon as={icon} fontSize="0.75rem" color="base.content.default" />
      </Flex>
      <Stack flexDirection="column" align="start" gap="0.25rem">
        <Text textStyle="subhead-2">{label}</Text>
        <Text textStyle="caption-2">{description}</Text>
      </Stack>
    </Stack>
  )
}
