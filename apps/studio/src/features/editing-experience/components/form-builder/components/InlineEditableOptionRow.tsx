import type { ReactNode } from "react"
import { Draggable } from "@hello-pangea/dnd"

import { DraggableTagButton } from "./DraggableTagButton"

interface InlineEditableOptionRowProps {
  draggableId: string
  index: number
  enabled: boolean
  label: string
  isAnyRowEditing: boolean
  isEditing: boolean
  isAnotherRowEditing: boolean
  isDuplicate: boolean
  isBlank: boolean
  hasError: boolean
  onSubmit: (value: string) => void
  onEditingChange: (isEditing: boolean) => void
  onDraftChange: (draft: string) => void
  trailing: ReactNode
}

export function InlineEditableOptionRow({
  draggableId,
  index,
  enabled,
  label,
  isAnyRowEditing,
  isEditing,
  isAnotherRowEditing,
  isDuplicate,
  isBlank,
  hasError,
  onSubmit,
  onEditingChange,
  onDraftChange,
  trailing,
}: InlineEditableOptionRowProps) {
  return (
    <Draggable
      draggableId={draggableId}
      disableInteractiveElementBlocking
      isDragDisabled={isAnyRowEditing}
      index={index}
    >
      {({ draggableProps, dragHandleProps, innerRef }) => (
        <DraggableTagButton.Root
          draggableProps={draggableProps}
          isError={hasError}
          isDragDisabled={isAnyRowEditing}
          ref={innerRef}
        >
          <DraggableTagButton.Handle dragHandleProps={dragHandleProps} />
          <DraggableTagButton.Body>
            <DraggableTagButton.Content gap={isEditing ? "0.5rem" : undefined}>
              <DraggableTagButton.EditableLabel
                value={label}
                placeholder={`Item ${index + 1}`}
                ariaLabel={`Option ${index + 1} name`}
                isInvalid={isDuplicate || isBlank}
                isDisabled={!enabled || isAnotherRowEditing}
                isEditing={isEditing}
                onSubmit={onSubmit}
                onEditingChange={onEditingChange}
                onDraftChange={onDraftChange}
              />
              {hasError ? (
                <DraggableTagButton.ErrorCaption>
                  {isDuplicate
                    ? "An option with this name already exists."
                    : isBlank
                      ? "Option name cannot be empty."
                      : undefined}
                </DraggableTagButton.ErrorCaption>
              ) : (
                isEditing && (
                  <DraggableTagButton.InfoCaption>
                    This will update across all items that use this option.
                  </DraggableTagButton.InfoCaption>
                )
              )}
            </DraggableTagButton.Content>
          </DraggableTagButton.Body>
          {!isEditing && (
            <DraggableTagButton.Trailing>
              {trailing}
            </DraggableTagButton.Trailing>
          )}
        </DraggableTagButton.Root>
      )}
    </Draggable>
  )
}
