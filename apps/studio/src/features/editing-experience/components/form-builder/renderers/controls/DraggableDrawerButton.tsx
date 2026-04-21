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
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react"
import { withJsonFormsMasterListItemProps } from "@jsonforms/react"
import { BiGridVertical, BiInfoCircle } from "react-icons/bi"

interface DraggableDrawerButtonProps extends OwnPropsOfMasterListItem {
  ref: React.Ref<HTMLDivElement>
  draggableProps: DraggableProvidedDraggableProps
  dragHandleProps: DraggableProvidedDragHandleProps | null
  setSelectedIndex: (selectedIndex?: number) => void
  isError: boolean
  listItemIcon?: IconType
  /** Merged into padding on the drag handle and label button (e.g. tighter `py`). */
  listItemContentProps?: BoxProps
  /** Rendered after the label area, typically flush right (e.g. row actions menu). */
  listItemTrailing?: ReactNode
  /** Caption under the row title (stacked with 0.25rem gap). */
  listItemSubtitle?: ReactNode
  /** When `isError` is true, replaces the default “Fix issues before saving” line. */
  listItemErrorCaption?: string
}

const DraggableDrawerButtonText = withJsonFormsMasterListItemProps(
  ({ childLabel, index }: StatePropsOfMasterItem) => (
    <Text textStyle="subhead-2" textAlign="start">
      {childLabel || `Item ${index + 1}`}
    </Text>
  ),
)

const DraggableDrawerButton = forwardRef<DraggableDrawerButtonProps, "div">(
  (
    {
      draggableProps,
      dragHandleProps,
      setSelectedIndex,
      index,
      isError,
      listItemIcon,
      listItemContentProps,
      listItemTrailing,
      listItemSubtitle,
      listItemErrorCaption,
      ...rest
    },
    ref,
  ) => {
    const mergedDragHandleProps: BoxProps = {
      py: isError ? "0.75rem" : "1.25rem",
      ...listItemContentProps,
    }
    const mergedLabelButtonProps: BoxProps = {
      py: isError ? "0.75rem" : "1rem",
      ...listItemContentProps,
    }

    return (
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
            <Flex
              cursor="grab"
              flexShrink={0}
              align="center"
              layerStyle="focusRing"
              {...mergedDragHandleProps}
              pl="0.5rem"
              pr="0.25rem"
              {...dragHandleProps}
            >
              <Icon as={BiGridVertical} fontSize="1.5rem" color="slate.300" />
            </Flex>
            <Box
              layerStyle="focusRing"
              as="button"
              type="button"
              flex={1}
              minW={0}
              display="flex"
              alignItems="center"
              cursor="pointer"
              {...mergedLabelButtonProps}
              pl="0.25rem"
              pr="1rem"
              onClick={() => setSelectedIndex(index)}
            >
              <HStack align="stretch" spacing="0.75rem" w="full">
                {listItemIcon && (
                  <Flex
                    p="0.25rem"
                    bg="interaction.main-subtle.default"
                    borderRadius="0.25rem"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    alignSelf="center"
                  >
                    <Icon
                      as={listItemIcon}
                      fontSize="0.75rem"
                      color="base.content.default"
                      aria-hidden
                    />
                  </Flex>
                )}
                <Stack align="start" gap="0.25rem" flex={1} minW={0}>
                  <DraggableDrawerButtonText {...rest} index={index} />
                  {listItemSubtitle}
                  {isError && (
                    <Text
                      as="span"
                      textStyle="caption-2"
                      color="utility.feedback.critical"
                      display="flex"
                      alignItems="center"
                    >
                      <Icon
                        aria-hidden
                        as={BiInfoCircle}
                        fontSize="0.75rem"
                        mr="0.25rem"
                      />
                      {listItemErrorCaption ?? "Fix issues before saving"}
                    </Text>
                  )}
                </Stack>
              </HStack>
            </Box>
            {listItemTrailing && (
              <Flex
                alignItems="center"
                flexShrink={0}
                p="0.5rem"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {listItemTrailing}
              </Flex>
            )}
          </HStack>
        </HStack>
      </Box>
    )
  },
)

export default DraggableDrawerButton
