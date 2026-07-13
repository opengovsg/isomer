import type { BoxProps, StackProps } from "@chakra-ui/react"
import type {
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd"
import type {
  OwnPropsOfMasterListItem,
  StatePropsOfMasterItem,
} from "@jsonforms/core"
import type { ReactNode } from "react"
import type { IconType } from "react-icons"
import {
  Box,
  Flex,
  forwardRef,
  HStack,
  Icon as ChakraIcon,
  Stack,
  Text,
} from "@chakra-ui/react"
import { withJsonFormsMasterListItemProps } from "@jsonforms/react"
import { IconButton, Input } from "@opengovsg/design-system-react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { BiCheck, BiGridVertical, BiSolidInfoCircle, BiX } from "react-icons/bi"

import { ROW_ACTION_ICON_BUTTON_PROPS } from "./constants"

const DraggableTagButtonContext = createContext({ isDragDisabled: false })

const useDraggableTagButton = () => useContext(DraggableTagButtonContext)

interface RootProps {
  draggableProps: DraggableProvidedDraggableProps
  isError: boolean
  isDragDisabled?: boolean
  children: ReactNode
}

const Root = forwardRef<RootProps, "div">(
  ({ draggableProps, isError, isDragDisabled = false, children }, ref) => {
    const contextValue = useMemo(() => ({ isDragDisabled }), [isDragDisabled])

    return (
      <DraggableTagButtonContext.Provider value={contextValue}>
        <Box my="0.25rem" ref={ref} {...draggableProps} w="full">
          <HStack
            spacing={0}
            border="1px solid"
            borderColor="base.divider.medium"
            borderRadius="6px"
            bg="white"
            transitionProperty="common"
            transitionDuration="normal"
            aria-invalid={isError}
            {...(isDragDisabled
              ? undefined
              : {
                  _hover: {
                    bg: "interaction.muted.main.hover",
                    borderColor: "interaction.main-subtle.hover",
                    _invalid: {
                      bg: "interaction.muted.critical.hover",
                      borderColor: "utility.feedback.critical",
                    },
                  },
                  _active: {
                    bg: "interaction.main-subtle.default",
                    borderColor: "interaction.main-subtle.hover",
                    shadow: "0px 1px 6px 0px #1361F026",
                    _invalid: {
                      bg: "interaction.muted.critical.hover",
                      borderColor: "utility.feedback.critical",
                      shadow: "0px 1px 6px 0px #C0343426",
                    },
                  },
                })}
            align="stretch"
            overflow="hidden"
          >
            {isError && (
              <Box
                aria-hidden
                bg="utility.feedback.critical"
                width="6px"
                mr="-6px"
              />
            )}
            <HStack flex={1} align="stretch" spacing={0} minW={0} w="100%">
              {children}
            </HStack>
          </HStack>
        </Box>
      </DraggableTagButtonContext.Provider>
    )
  },
)

interface HandleProps {
  dragHandleProps: DraggableProvidedDragHandleProps | null
  py?: BoxProps["py"]
}

const Handle = ({ dragHandleProps, py = "0.5rem" }: HandleProps) => {
  const { isDragDisabled } = useDraggableTagButton()

  return (
    <Flex
      cursor={isDragDisabled ? "not-allowed" : "grab"}
      flexShrink={0}
      align="center"
      layerStyle="focusRing"
      py={py}
      pl="0.5rem"
      pr="0.25rem"
      opacity={isDragDisabled ? 0.4 : 1}
      {...(isDragDisabled ? undefined : dragHandleProps)}
    >
      <ChakraIcon as={BiGridVertical} fontSize="1.5rem" color="slate.300" />
    </Flex>
  )
}

interface BodyProps {
  onClick?: () => void
  children: ReactNode
  py?: BoxProps["py"]
}

const BODY_BASE_STYLE: BoxProps = {
  layerStyle: "focusRing",
  flex: 1,
  minW: 0,
  display: "flex",
  alignItems: "center",
  pl: "0.25rem",
  pr: "1rem",
}

const Body = ({ onClick, children, py = "0.5rem" }: BodyProps) => {
  const content = (
    <HStack align="stretch" spacing="0.75rem" w="full">
      {children}
    </HStack>
  )

  if (!onClick) {
    return (
      <Box {...BODY_BASE_STYLE} cursor="default" py={py}>
        {content}
      </Box>
    )
  }

  return (
    <Box
      {...BODY_BASE_STYLE}
      as="button"
      type="button"
      cursor="pointer"
      py={py}
      onClick={onClick}
    >
      {content}
    </Box>
  )
}

interface IconBadgeProps {
  icon: IconType
}

const IconBadge = ({ icon }: IconBadgeProps) => (
  <Flex
    p="0.25rem"
    bg="interaction.main-subtle.default"
    borderRadius="0.25rem"
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
    alignSelf="center"
  >
    <ChakraIcon
      as={icon}
      fontSize="0.75rem"
      color="base.content.default"
      aria-hidden
    />
  </Flex>
)

type ContentProps = Pick<StackProps, "children" | "gap">

const Content = ({ children, gap = "0.25rem" }: ContentProps) => (
  <Stack align="start" gap={gap} flex={1} minW={0}>
    {children}
  </Stack>
)

const EDITABLE_LABEL_ICON_BUTTON_PROPS = {
  ...ROW_ACTION_ICON_BUTTON_PROPS,
  color: "interaction.links.neutral-default",
} as const

const LabelRaw = withJsonFormsMasterListItemProps(
  ({ childLabel, index }: StatePropsOfMasterItem) => (
    <Text textStyle="subhead-2" textAlign="start">
      {childLabel || `Item ${index + 1}`}
    </Text>
  ),
)

type LabelProps = Pick<
  OwnPropsOfMasterListItem,
  "index" | "path" | "schema" | "uischema" | "enabled" | "removeItem"
>

const Label = (props: LabelProps) => (
  <LabelRaw
    {...props}
    handleSelect={() => () => undefined}
    selected={false}
    childLabelProp={undefined}
    translations={{}}
  />
)

interface EditableLabelProps {
  value: string
  placeholder: string
  ariaLabel: string
  isInvalid: boolean
  isDisabled: boolean
  isEditing: boolean
  onSubmit: (value: string) => void
  onEditingChange: (isEditing: boolean) => void
  onDraftChange?: (draft: string) => void
}

/**
 * Parent-controlled click-to-edit label. Draft is trimmed on save.
 */
const EditableLabel = ({
  value,
  placeholder,
  ariaLabel,
  isInvalid,
  isDisabled,
  isEditing,
  onSubmit,
  onEditingChange,
  onDraftChange,
}: EditableLabelProps) => {
  const { isDragDisabled } = useDraggableTagButton()
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!isEditing) setDraft(value)
  }, [isEditing, value])

  const isDirty = draft !== value

  const handleSave = () => {
    if (isInvalid) return
    const trimmed = draft.trim()
    if (trimmed !== value) onSubmit(trimmed)
    onEditingChange(false)
  }

  const handleDiscard = () => {
    setDraft(value)
    onEditingChange(false)
  }

  if (!isEditing) {
    return (
      <Text
        as="button"
        type="button"
        textStyle="subhead-2"
        textAlign="start"
        color={
          isDragDisabled
            ? "interaction.support.disabled-content"
            : "base.content.default"
        }
        cursor={isDisabled ? "default" : "pointer"}
        w="full"
        disabled={isDisabled}
        onClick={() => {
          setDraft(value)
          onEditingChange(true)
        }}
      >
        {value || placeholder}
      </Text>
    )
  }

  return (
    <HStack spacing="0.25rem" align="center" w="full">
      <Input
        autoFocus
        size="sm"
        value={draft}
        placeholder={placeholder}
        aria-label={ariaLabel}
        isInvalid={isInvalid}
        focusBorderColor={
          isInvalid ? "interaction.critical.default" : undefined
        }
        onChange={(e) => {
          setDraft(e.target.value)
          onDraftChange?.(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          if (e.key === "Escape") handleDiscard()
        }}
      />
      <IconButton
        aria-label="Save changes"
        icon={<BiCheck fontSize="1.5rem" />}
        {...EDITABLE_LABEL_ICON_BUTTON_PROPS}
        color="utility.feedback.success"
        isDisabled={!isDirty || isInvalid}
        onClick={handleSave}
      />
      <IconButton
        aria-label="Discard changes"
        icon={<BiX fontSize="1.5rem" />}
        {...EDITABLE_LABEL_ICON_BUTTON_PROPS}
        colorScheme="critical"
        onClick={handleDiscard}
      />
    </HStack>
  )
}

const Subtitle = ({ children }: { children: ReactNode }) => (
  <Text textStyle="caption-2" color="base.content.medium">
    {children}
  </Text>
)

const ErrorCaption = ({ children }: { children?: ReactNode }) => (
  <Text
    as="span"
    textStyle="caption-2"
    color="utility.feedback.critical"
    display="flex"
    alignItems="center"
  >
    <ChakraIcon
      aria-hidden
      as={BiSolidInfoCircle}
      fontSize="0.75rem"
      mr="0.25rem"
    />
    {children ?? "Fix issues before saving"}
  </Text>
)

const InfoCaption = ({ children }: { children: ReactNode }) => (
  <Text
    as="span"
    textStyle="caption-2"
    color="base.content.default"
    display="flex"
    alignItems="center"
  >
    <ChakraIcon
      aria-hidden
      as={BiSolidInfoCircle}
      fontSize="0.75rem"
      mr="0.25rem"
      color="base.content.medium"
    />
    {children}
  </Text>
)

const Trailing = ({ children }: { children: ReactNode }) => (
  <Flex
    alignItems="center"
    flexShrink={0}
    p="0.5rem"
    onPointerDown={(e) => e.stopPropagation()}
  >
    {children}
  </Flex>
)

export const DraggableTagButton = {
  Root,
  Handle,
  Body,
  Icon: IconBadge,
  Content,
  Label,
  EditableLabel,
  Subtitle,
  ErrorCaption,
  InfoCaption,
  Trailing,
}
