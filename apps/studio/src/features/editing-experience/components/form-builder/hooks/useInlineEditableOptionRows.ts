import type { DropResult } from "@hello-pangea/dnd"
import { composePaths, update } from "@jsonforms/core"
import { useJsonForms } from "@jsonforms/react"
import { useCallback, useState } from "react"

import { useLiveLabelIssues } from "./useLiveLabelIssues"

export function useInlineEditableOptionRows(path: string) {
  const { dispatch } = useJsonForms()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingDraftLabel, setEditingDraftLabel] = useState("")

  const isAnyRowEditing = editingIndex !== null

  const { blank: blankOptionIndices, duplicate: duplicateOptionIndices } =
    useLiveLabelIssues({ path, editingIndex, editingDraftLabel })

  const clearEditing = useCallback(() => {
    setEditingIndex(null)
    setEditingDraftLabel("")
  }, [])

  // editingIndex is a row position, not item identity — clear before reorder so
  // a pending label submit cannot write to whichever item ends up at that index.
  const wrapDragEnd = useCallback(
    (onDragEnd: (result: DropResult) => void) => (result: DropResult) => {
      clearEditing()
      onDragEnd(result)
    },
    [clearEditing],
  )

  const submitLabel = useCallback(
    (index: number, value: string) => {
      dispatch?.(
        update(
          composePaths(composePaths(path, `${index}`), "label"),
          () => value,
        ),
      )
    },
    [dispatch, path],
  )

  const createEditingChangeHandler = useCallback(
    (index: number, committedLabel: string) => (isEditing: boolean) => {
      if (isEditing && isAnyRowEditing && editingIndex !== index) return
      setEditingIndex(isEditing ? index : null)
      setEditingDraftLabel(isEditing ? committedLabel : "")
    },
    [editingIndex, isAnyRowEditing],
  )

  return {
    editingIndex,
    isAnyRowEditing,
    setEditingDraftLabel,
    blankOptionIndices,
    duplicateOptionIndices,
    wrapDragEnd,
    submitLabel,
    createEditingChangeHandler,
  }
}
