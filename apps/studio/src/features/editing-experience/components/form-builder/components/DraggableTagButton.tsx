import type { BoxProps } from "@chakra-ui/react"
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
import { BiGridVertical, BiInfoCircle } from "react-icons/bi"

interface RootProps {
  draggableProps: DraggableProvidedDraggableProps
  isError: boolean
  children: ReactNode
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const Root = forwardRef<RootProps, "div">(
  ({ draggableProps, isError, children, onMouseEnter, onMouseLeave }, ref) => (
    <Box
      my="0.25rem"
      ref={ref}
      {...draggableProps}
      w="full"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <HStack
        spacing={0}
        border="1px solid"
        borderColor="base.divider.medium"
        borderRadius="6px"
        bg="white"
        transitionProperty="common"
        transitionDuration="normal"
        aria-invalid={isError}
        _hover={{
          bg: "interaction.muted.main.hover",
          borderColor: "interaction.main-subtle.hover",
          _invalid: {
            bg: "interaction.muted.critical.hover",
            borderColor: "utility.feedback.critical",
          },
        }}
        _active={{
          bg: "interaction.main-subtle.default",
          borderColor: "interaction.main-subtle.hover",
          shadow: "0px 1px 6px 0px #1361F026",
          _invalid: {
            bg: "interaction.muted.critical.hover",
            borderColor: "utility.feedback.critical",
            shadow: "0px 1px 6px 0px #C0343426",
          },
        }}
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
  ),
)

interface HandleProps {
  dragHandleProps: DraggableProvidedDragHandleProps | null
  py?: BoxProps["py"]
}

const Handle = ({ dragHandleProps, py = "0.5rem" }: HandleProps) => (
  <Flex
    cursor="grab"
    flexShrink={0}
    align="center"
    layerStyle="focusRing"
    py={py}
    pl="0.5rem"
    pr="0.25rem"
    {...dragHandleProps}
  >
    <ChakraIcon as={BiGridVertical} fontSize="1.5rem" color="slate.300" />
  </Flex>
)

interface BodyProps {
  onClick: () => void
  children: ReactNode
  py?: BoxProps["py"]
}

const Body = ({ onClick, children, py = "0.5rem" }: BodyProps) => (
  <Box
    layerStyle="focusRing"
    as="button"
    type="button"
    flex={1}
    minW={0}
    display="flex"
    alignItems="center"
    cursor="pointer"
    py={py}
    pl="0.25rem"
    pr="1rem"
    onClick={onClick}
  >
    <HStack align="stretch" spacing="0.75rem" w="full">
      {children}
    </HStack>
  </Box>
)

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

const Content = ({ children }: { children: ReactNode }) => (
  <Stack align="start" gap="0.25rem" flex={1} minW={0}>
    {children}
  </Stack>
)

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
    <ChakraIcon aria-hidden as={BiInfoCircle} fontSize="0.75rem" mr="0.25rem" />
    {children ?? "Fix issues before saving"}
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
  Subtitle,
  ErrorCaption,
  Trailing,
}
