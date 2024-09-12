import type {
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd"
import type {
  OwnPropsOfMasterListItem,
  StatePropsOfMasterItem,
} from "@jsonforms/core"
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
      ...rest
    },
    ref,
  ) => {
    return (
      <Box my="0.375rem" ref={ref} {...draggableProps} w="full">
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
          <Flex
            cursor="grab"
            pl="0.5rem"
            pr="0.25rem"
            py="1.25rem"
            layerStyle="focusRing"
            {...dragHandleProps}
          >
            <Icon as={BiGridVertical} fontSize="1.5rem" color="slate.300" />
          </Flex>
          <Box
            layerStyle="focusRing"
            as="button"
            onClick={() => setSelectedIndex(index)}
            pl="0.25rem"
            pr="1rem"
            py={isError ? "0.75rem" : "1rem"}
            w="100%"
          >
            <Stack align="start" gap="0.25rem">
              <DraggableDrawerButtonText {...rest} index={index} />
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
                  Fix issues before saving
                </Text>
              )}
            </Stack>
          </Box>
        </HStack>
      </Box>
    )
  },
)

export default DraggableDrawerButton
