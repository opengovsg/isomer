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
    <Text
      textStyle="subhead-2"
      textColor="base.content.strong"
      textAlign="start"
    >
      {childLabel || `Item ${index + 1}`}
    </Text>
  ),
)

const DraggableDrawerButton = forwardRef(
  (
    {
      draggableProps,
      dragHandleProps,
      setSelectedIndex,
      index,
      ...rest
    }: DraggableDrawerButtonProps,
    ref,
  ) => {
    return (
      <Box
        my="0.375rem"
        borderWidth="1px"
        borderColor="base.divider.medium"
        borderRadius="lg"
        w="100%"
        bgColor="utility.ui"
        transitionProperty="background-color"
        transitionDuration="0.2s"
        _hover={{
          bgColor: "interaction.main-subtle.default",
        }}
        _active={{
          bgColor: "interaction.main-subtle.default",
          borderColor: "base.content.brand",
          outline: "1px solid",
          outlineColor: "base.content.brand",
        }}
        ref={ref}
        {...draggableProps}
      >
        <HStack spacing={0}>
          <Box
            cursor="grab"
            pl="0.5rem"
            pr="0.25rem"
            py="0.75rem"
            {...dragHandleProps}
          >
            <Icon as={BiGridVertical} fontSize="1.5rem" color="slate.300" />
          </Box>
          <Box
            as="button"
            onClick={() => setSelectedIndex(index)}
            pl="0.25rem"
            pr="1rem"
            py="0.75rem"
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
