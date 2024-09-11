import type {
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd"
import type {
  OwnPropsOfMasterListItem,
  StatePropsOfMasterItem,
} from "@jsonforms/core"
import { Box, forwardRef, HStack, Icon, Text } from "@chakra-ui/react"
import { withJsonFormsMasterListItemProps } from "@jsonforms/react"
import { BiGridVertical } from "react-icons/bi"

interface DraggableDrawerButtonProps extends OwnPropsOfMasterListItem {
  ref: React.Ref<HTMLDivElement>
  draggableProps: DraggableProvidedDraggableProps
  dragHandleProps: DraggableProvidedDragHandleProps | null
  setSelectedIndex: (selectedIndex?: number) => void
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
    { draggableProps, dragHandleProps, setSelectedIndex, index, ...rest },
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
          _hover={{
            bg: "interaction.muted.main.hover",
            borderColor: "interaction.main-subtle.hover",
          }}
          _active={{
            bg: "interaction.main-subtle.default",
            borderColor: "interaction.main-subtle.hover",
            shadow: "0px 1px 6px 0px #1361F026",
          }}
        >
          <Box
            cursor="grab"
            pl="0.5rem"
            pr="0.25rem"
            py="1rem"
            {...dragHandleProps}
          >
            <Icon as={BiGridVertical} fontSize="1.5rem" color="slate.300" />
          </Box>
          <Box
            as="button"
            onClick={() => setSelectedIndex(index)}
            pl="0.25rem"
            pr="1rem"
            py="1rem"
            w="100%"
          >
            <DraggableDrawerButtonText {...rest} index={index} />
          </Box>
        </HStack>
      </Box>
    )
  },
)

export default DraggableDrawerButton
