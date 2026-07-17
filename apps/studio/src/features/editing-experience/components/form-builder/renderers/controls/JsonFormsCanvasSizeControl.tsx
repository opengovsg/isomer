import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Text } from "@chakra-ui/react"
import {
  and,
  or,
  rankWith,
  schemaMatches,
  schemaTypeIs,
  uiTypeIs,
} from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import {
  findCanvasPreviewContainer,
  resolveCanvasWidthPercent,
} from "../../../../utils/canvasPreviewBlock"
import { JsonFormsIntegerControl } from "./JsonFormsIntegerControl"

export const jsonFormsCanvasSizeControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CanvasSizeControl,
  and(
    uiTypeIs("Control"),
    or(schemaTypeIs("integer"), schemaTypeIs("number")),
    schemaMatches((schema) => schema.format === "canvasSize"),
  ),
)

// The rendered canvas's native resize handle occupies its bottom-right
// corner; the canvas's own padding keeps this region clear of any block
const RESIZE_HANDLE_SIZE_PX = 16

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

// Resolves the edited canvas's rendered container in the live preview: the
// page block at currActiveIdx, found by counting the canvases before it.
// Outside the editor drawer (or before the preview has rendered) this
// resolves to null.
const useCanvasPreviewLocator = (): (() => HTMLElement | null) => {
  const editorContext = useOptionalEditorDrawerContext()
  const content = editorContext?.previewPageState.content
  const currActiveIdx = editorContext?.currActiveIdx

  const canvasOrdinal = useMemo(() => {
    if (
      content === undefined ||
      currActiveIdx === undefined ||
      content[currActiveIdx]?.type !== "canvas"
    ) {
      return null
    }
    return content
      .slice(0, currActiveIdx)
      .filter((block) => block.type === "canvas").length
  }, [content, currActiveIdx])

  return useCallback(
    () =>
      canvasOrdinal === null
        ? null
        : findCanvasPreviewContainer(document, canvasOrdinal),
    [canvasOrdinal],
  )
}

// The canvas renders with a native CSS resize handle, but in the editor a
// handle drag on the live preview would snap back on the next re-render
// because nothing wrote the new size to the block data. While the canvas
// form is open, a drag that starts on the handle commits the resulting size
// to this control's field on release (width as a percentage of the canvas's
// parent, height in pixels), clamped to the schema bounds. Returns a counter
// that increments per committed resize, so the numeric input can be
// remounted to display the new value (it is uncontrolled and only reads its
// data when mounting).
const useCommitPreviewCanvasResize = ({
  path,
  schema,
  handleChange,
  visible,
  enabled,
}: ControlProps): number => {
  const locateCanvas = useCanvasPreviewLocator()
  const [resizeCount, setResizeCount] = useState(0)
  const dimension = path.split(".").at(-1) === "width" ? "width" : "height"
  const { minimum, maximum } = schema

  useEffect(() => {
    if (!visible || !enabled) {
      return
    }
    const canvas = locateCanvas()
    const previewWindow = canvas?.ownerDocument.defaultView
    if (!canvas || !previewWindow) {
      return
    }

    let startSize: { width: number; height: number } | null = null

    const grabHandle = (event: MouseEvent) => {
      // The handle belongs to the canvas element itself; events from the
      // blocks inside it target descendants
      if (event.button !== 0 || event.target !== canvas) {
        return
      }
      const rect = canvas.getBoundingClientRect()
      if (
        rect.right - event.clientX > RESIZE_HANDLE_SIZE_PX ||
        rect.bottom - event.clientY > RESIZE_HANDLE_SIZE_PX
      ) {
        return
      }
      startSize = { width: rect.width, height: rect.height }
    }

    const commitResize = () => {
      if (!startSize) {
        return
      }
      const started = startSize
      startSize = null
      const rect = canvas.getBoundingClientRect()
      // A one-dimensional drag must not freeze the other, untouched
      // dimension into the data
      if (Math.abs(rect[dimension] - started[dimension]) < 1) {
        return
      }
      const value =
        dimension === "width" ? resolveCanvasWidthPercent(canvas) : rect.height
      if (value === null) {
        return
      }
      handleChange(
        path,
        clamp(
          Math.round(value),
          typeof minimum === "number" ? minimum : 1,
          typeof maximum === "number" ? maximum : Number.MAX_SAFE_INTEGER,
        ),
      )
      setResizeCount((count) => count + 1)
    }

    canvas.addEventListener("mousedown", grabHandle)
    previewWindow.addEventListener("mouseup", commitResize)
    return () => {
      canvas.removeEventListener("mousedown", grabHandle)
      previewWindow.removeEventListener("mouseup", commitResize)
    }
  }, [
    visible,
    enabled,
    dimension,
    minimum,
    maximum,
    path,
    handleChange,
    locateCanvas,
  ])

  return resizeCount
}

function JsonFormsCanvasSizeControl(props: ControlProps) {
  const previewResizeCount = useCommitPreviewCanvasResize(props)

  return (
    <>
      <JsonFormsIntegerControl key={previewResizeCount} {...props} />
      {/* One hint for both size fields, under the last of them */}
      {props.path.split(".").at(-1) === "height" && (
        <Text mt="0.5rem" textStyle="body-2" textColor="base.content.medium">
          You can also resize the canvas freely by dragging the handle at its
          bottom-right corner in the page preview.
        </Text>
      )}
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsCanvasSizeControl)
