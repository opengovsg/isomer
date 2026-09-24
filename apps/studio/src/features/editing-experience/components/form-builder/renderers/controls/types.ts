import type {
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd"
import type { OwnPropsOfMasterListItem } from "@jsonforms/core"
import type { Ref } from "react"

export type DraggableArrayItemRenderProps = OwnPropsOfMasterListItem & {
  ref: Ref<HTMLDivElement>
  draggableProps: DraggableProvidedDraggableProps
  dragHandleProps: DraggableProvidedDragHandleProps | null
  setSelectedIndex: (selectedIndex?: number) => void
  isError: boolean
}
