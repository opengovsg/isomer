import type {
  DraggableProvidedDragHandleProps,
  DropResult,
} from "@hello-pangea/dnd"
import type { ReactNode } from "react"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { composePaths } from "@jsonforms/core"

import { useBuilderErrors } from "../ErrorProvider"
import { AddItemButton } from "./AddItemButton"
import { DraggableTagButton } from "./DraggableTagButton"
import { EmptyArray } from "./EmptyArray"

interface DraggableArrayListProps {
  label: string
  description?: string
  path: string
  count: number
  isAddDisabled: boolean
  onAdd: () => void
  onDragEnd: (result: DropResult) => void
  /** Renders the row inside its draggable root: handle, body and trailing. */
  renderRow: (
    index: number,
    row: {
      hasError: boolean
      dragHandleProps: DraggableProvidedDragHandleProps | null
    },
  ) => ReactNode
}

/**
 * Header with an add button over a drag-to-reorder list of array items.
 * Callers own the array state (see `useArray`) and each row's contents.
 */
export function DraggableArrayList({
  label,
  description,
  path,
  count,
  isAddDisabled,
  onAdd,
  onDragEnd,
  renderRow,
}: DraggableArrayListProps) {
  const { hasErrorAt } = useBuilderErrors()

  return (
    <VStack spacing={0} align="start">
      <VStack align="start" spacing="0.25rem" w="full">
        <HStack w="full" justifyContent="space-between" align="center">
          <Text textStyle="subhead-1" flex={1}>
            {label}
          </Text>
          <AddItemButton onClick={onAdd} isDisabled={isAddDisabled}>
            Add item
          </AddItemButton>
        </HStack>
        {description && (
          <Text textStyle="body-2" textColor="base.content.default">
            {description}
          </Text>
        )}
      </VStack>
      <Box w="full" mt={description ? "0.75rem" : "0.25rem"}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={path}>
            {({ droppableProps, innerRef, placeholder }) => (
              <VStack
                {...droppableProps}
                align="baseline"
                w="100%"
                h="100%"
                spacing={0}
                ref={innerRef}
              >
                {count === 0 && <EmptyArray />}

                {[...Array(count).keys()].map((index) => {
                  const childPath = composePaths(path, `${index}`)
                  const hasError = hasErrorAt(childPath)

                  return (
                    <Draggable
                      key={childPath}
                      draggableId={childPath}
                      disableInteractiveElementBlocking
                      index={index}
                    >
                      {({ draggableProps, dragHandleProps, innerRef }) => (
                        <DraggableTagButton.Root
                          draggableProps={draggableProps}
                          isError={hasError}
                          ref={innerRef}
                        >
                          {renderRow(index, { hasError, dragHandleProps })}
                        </DraggableTagButton.Root>
                      )}
                    </Draggable>
                  )
                })}

                {placeholder}
              </VStack>
            )}
          </Droppable>
        </DragDropContext>
      </Box>
    </VStack>
  )
}
