import type { ButtonProps, StackProps } from "@chakra-ui/react"
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd"
import type { IconType } from "react-icons"
import { chakra, Flex, HStack, Icon, Stack, Text } from "@chakra-ui/react"
import { BiGridVertical, BiSolidErrorCircle } from "react-icons/bi"

export interface BaseBlockProps {
  icon?: IconType
  dragHandle?: React.ReactNode
  label: string
  description?: string
  containerProps?: StackProps
  onClick?: () => void
  draggableProps?: DraggableProvidedDragHandleProps | null
  invalidProps?: {
    description: string
  }
}

export const BaseBlock = ({
  icon,
  dragHandle,
  label,
  description,
  draggableProps,
  containerProps,
  onClick,
  invalidProps,
}: BaseBlockProps): JSX.Element => {
  const actualDraggableProps = draggableProps ?? {}

  const Description = () => {
    if (invalidProps) {
      return (
        <HStack gap="0.25rem">
          <Icon
            as={BiSolidErrorCircle}
            fontSize="1rem"
            color="utility.feedback.critical"
          />
          <Text textStyle="caption-1" color="utility.feedback.critical">
            {invalidProps.description}
          </Text>
        </HStack>
      )
    }

    if (description) {
      return (
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
      )
    }
  }

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
      aria-invalid={!!invalidProps}
      _hover={{
        bg: "interaction.muted.main.hover",
        borderColor: "interaction.main-subtle.hover",
        _invalid: {
          shadow: "0px 1px 6px 0px #C0343426",
        },
      }}
      _active={{
        bg: "interaction.main-subtle.default",
        borderColor: "interaction.main-subtle.hover",
        shadow: "0px 1px 6px 0px #1361F026",
      }}
      _invalid={{
        bg: "utility.feedback.critical-subtle",
        borderColor: "utility.feedback.critical",
      }}
      bg="white"
      py="0.75rem"
      px="0.75rem"
      flexDirection="row"
      align="center"
      textAlign="start"
      onClick={onClick}
      {...actualDraggableProps}
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
      <Stack align="start" gap="0.25rem" overflow="auto">
        <Text textStyle="subhead-2" noOfLines={1} wordBreak="break-word">
          {label}
        </Text>
        <Description />
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
