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
  variant?: "horizontal" | "vertical"
  containerProps?: StackProps
  onClick?: () => void
  draggableProps?: DraggableProvidedDragHandleProps | null
  invalidProps?: {
    description: string
  }
  isHidden?: boolean
}

export const BaseBlock = ({
  icon,
  dragHandle,
  label,
  description,
  variant = "horizontal",
  draggableProps,
  containerProps,
  onClick,
  invalidProps,
  isHidden,
}: BaseBlockProps): JSX.Element | false => {
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
    !isHidden && (
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
        bg={isHidden ? "gray.100" : "white"}
        py={variant === "vertical" ? "1.25rem" : "0.75rem"}
        px={variant === "vertical" ? "1.25rem" : "0.75rem"}
        flexDirection="row"
        align={variant === "vertical" ? "flex-start" : "center"}
        textAlign="start"
        onClick={onClick}
        opacity={isHidden ? 0.7 : 1}
        {...actualDraggableProps}
        {...containerProps}
      >
        {dragHandle}
        {variant === "vertical" ? (
          <Flex direction="column" align="flex-start" gap="0.75rem">
            <Flex
              p="0.25rem"
              bg="interaction.main-subtle.default"
              borderRadius="0.25rem"
              align="center"
              justify="center"
            >
              <Icon
                as={icon}
                boxSize="1.25rem"
                flexShrink={0}
                color="base.content.default"
              />
            </Flex>
            <Stack
              align="start"
              gap="0.25rem"
              overflow="auto"
              w="100%"
              minW={0}
            >
              <Text textStyle="subhead-2" noOfLines={1} wordBreak="break-word">
                {label}
              </Text>
              <Description />
            </Stack>
          </Flex>
        ) : (
          <>
            {icon && (
              <Flex
                p="0.25rem"
                bg="interaction.main-subtle.default"
                borderRadius="4px"
                mr="0.25rem"
              >
                <Icon
                  as={icon}
                  fontSize="0.75rem"
                  color="base.content.default"
                />
              </Flex>
            )}
            <Stack align="start" gap="0.25rem" overflow="auto">
              <Text
                textStyle="subhead-2"
                noOfLines={1}
                wordBreak="break-word"
                color={isHidden ? "base.content.medium" : undefined}
              >
                {label}
              </Text>
              <Description />
            </Stack>
          </>
        )}
      </HStack>
    )
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
