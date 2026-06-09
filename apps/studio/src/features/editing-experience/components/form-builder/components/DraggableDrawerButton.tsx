import type {
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd"
import type { OwnPropsOfMasterListItem } from "@jsonforms/core"
import { forwardRef } from "@chakra-ui/react"

import { DraggableTagButton } from "./DraggableTagButton"

interface DraggableDrawerButtonProps extends OwnPropsOfMasterListItem {
  draggableProps: DraggableProvidedDraggableProps
  dragHandleProps: DraggableProvidedDragHandleProps | null
  setSelectedIndex: (selectedIndex?: number) => void
  isError: boolean
}

const DraggableDrawerButton = forwardRef<DraggableDrawerButtonProps, "div">(
  (
    {
      draggableProps,
      dragHandleProps,
      setSelectedIndex,
      index,
      isError,
      ...ownProps
    },
    ref,
  ) => (
    <DraggableTagButton.Root
      draggableProps={draggableProps}
      isError={isError}
      ref={ref}
    >
      <DraggableTagButton.Handle dragHandleProps={dragHandleProps} />
      <DraggableTagButton.Body onClick={() => setSelectedIndex(index)}>
        <DraggableTagButton.Content>
          <DraggableTagButton.Label index={index} {...ownProps} />
          {isError && <DraggableTagButton.ErrorCaption />}
        </DraggableTagButton.Content>
      </DraggableTagButton.Body>
    </DraggableTagButton.Root>
  ),
)

export default DraggableDrawerButton
