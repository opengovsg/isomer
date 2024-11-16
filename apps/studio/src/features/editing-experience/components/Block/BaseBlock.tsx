import type { ButtonProps, StackProps } from "@chakra-ui/react"
import type { IconType } from "react-icons"
import { chakra, Flex, HStack, Icon, Stack, Text } from "@chakra-ui/react"
import { BiGridVertical } from "react-icons/bi"

interface BaseBlockProps {
  icon?: IconType
  dragHandle?: React.ReactNode
  label: string
  description?: string
  containerProps?: StackProps
  onClick?: () => void
}

export const BaseBlock = ({
  icon,
  dragHandle,
  label,
  description,
  containerProps,
  onClick,
}: BaseBlockProps): JSX.Element => {
  return (
    <HStack
      as="button"
      layerStyle="focusRing"
      w="100%"
      borderRadius="6px"
      border="1px solid"
      borderColor="base.divider.medium"
      transitionProperty="common"
      transitionDuration="normal"
      _hover={{
        bg: "interaction.muted.main.hover",
        borderColor: "interaction.main-subtle.hover",
      }}
      _active={{
        bg: "interaction.main-subtle.default",
        borderColor: "interaction.main-subtle.hover",
        shadow: "0px 1px 6px 0px #1361F026",
      }}
      bg="white"
      py="0.75rem"
      px="0.75rem"
      flexDirection="row"
      align="center"
      textAlign="start"
      onClick={onClick}
      {...containerProps}
    >
      {dragHandle}
      {icon && (
        <Flex
          p="0.25rem"
          bg="interaction.main-subtle.default"
          borderRadius="4px"
          mr="0.25rem"
        >
          <Icon as={icon} fontSize="0.75rem" color="base.content.default" />
        </Flex>
      )}
      <Stack align="start" gap="0.25rem">
        <Text textStyle="subhead-2" noOfLines={1}>
          {label}
        </Text>
        {description && (
          <Text
            textStyle="caption-2"
            color={
              dragHandle
                ? "interaction.support.placeholder"
                : "base.content.default"
            }
          >
            {description}
          </Text>
        )}
      </Stack>
    </HStack>
  )
}

interface BaseBlockDragHandleProps extends ButtonProps {
  isDragging: boolean
}

export const BaseBlockDragHandle = ({
  isDragging,
  ...handleProps
}: BaseBlockDragHandleProps): JSX.Element => {
  return (
    <chakra.button
      display="flex"
      tabIndex={0}
      layerStyle="focusRing"
      borderRadius="4px"
      transition="color 0.2s ease"
      _hover={{
        color: "slate.400",
      }}
      color={isDragging ? "slate.400" : "slate.300"}
      {...handleProps}
    >
      <Icon as={BiGridVertical} fontSize="1.5rem" />
    </chakra.button>
  )
}
