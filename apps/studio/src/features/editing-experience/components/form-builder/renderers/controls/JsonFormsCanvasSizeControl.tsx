import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Text, useToken } from "@chakra-ui/react"
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

import type { CanvasSizeBadge } from "../../../../utils/canvasPreviewBlock"
import {
  findCanvasPreviewContainer,
  resolveCanvasWidthPercent,
  showCanvasSizeBadge,
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

// The preview canvas's resize handle occupies its bottom-right corner;
// the canvas's own padding keeps this region clear of any block
const RESIZE_HANDLE_SIZE_PX = 16

// Holding Shift while dragging the handle snaps the size to tidy steps
// (width in % of the parent, height in px), Wix-style
const RESIZE_SNAP_STEP = { width: 5, height: 25 } as const

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const snapToStep = (value: number, step: number): number =>
  Math.round(value / step) * step

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

// The published canvas renders without a native resize handle — site
// visitors must not be able to resize the layout the editor designed — so
// the editor applies the affordance itself while the canvas form is open.
// Owned by the height instance alone so the two size controls cannot fight
// over the same inline style.
const usePreviewCanvasResizeAffordance = (
  { visible, enabled }: ControlProps,
  dimension: "width" | "height",
): void => {
  const locateCanvas = useCanvasPreviewLocator()

  useEffect(() => {
    if (!visible || !enabled || dimension !== "height") {
      return
    }
    const canvas = locateCanvas()
    if (!canvas) {
      return
    }
    // React manages no inline resize on the canvas, so the mutation
    // survives preview re-renders and only needs restoring on close
    const originalResize = canvas.style.resize
    canvas.style.resize = "both"
    return () => {
      canvas.style.resize = originalResize
    }
  }, [visible, enabled, dimension, locateCanvas])
}

// A resize-handle drag on the live preview would snap back on the next
// re-render because nothing wrote the new size to the block data. While the
// canvas form is open, a drag that starts on the handle commits the
// resulting size to this control's field on release (width as a percentage
// of the canvas's parent, height in pixels), clamped to the schema bounds.
// Returns a counter that increments per committed resize, so the numeric
// input can be remounted to display the new value (it is uncontrolled and
// only reads its data when mounting).
const useCommitPreviewCanvasResize = ({
  path,
  schema,
  data,
  handleChange,
  visible,
  enabled,
}: ControlProps): number => {
  const locateCanvas = useCanvasPreviewLocator()
  const [resizeCount, setResizeCount] = useState(0)
  const [badgeColor] = useToken("colors", ["interaction.main.default"])
  const dimension = path.split(".").at(-1) === "width" ? "width" : "height"
  const { minimum, maximum } = schema
  const savedValue: unknown = data

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
    let badge: CanvasSizeBadge | null = null

    const dropBadge = () => {
      badge?.cleanup()
      badge = null
    }

    // Wix-style live readout while the handle is being dragged: the badge
    // shows the size the release would commit. Owned by the height instance
    // alone (like the resize affordance) so the two size controls cannot
    // pin duplicate badges.
    const trackResize = (event: MouseEvent) => {
      if (!startSize) {
        return
      }
      badge ??= showCanvasSizeBadge(canvas, badgeColor)
      const rect = canvas.getBoundingClientRect()
      const widthPercent = resolveCanvasWidthPercent(canvas)
      const width =
        widthPercent === null
          ? `${Math.round(rect.width)}px`
          : `${
              event.shiftKey
                ? snapToStep(widthPercent, RESIZE_SNAP_STEP.width)
                : Math.round(widthPercent)
            }%`
      const height = event.shiftKey
        ? snapToStep(rect.height, RESIZE_SNAP_STEP.height)
        : Math.round(rect.height)
      badge.update(`${width} × ${height}px`)
    }

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

    const commitResize = (event: MouseEvent) => {
      dropBadge()
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
      const committed = clamp(
        event.shiftKey
          ? snapToStep(value, RESIZE_SNAP_STEP[dimension])
          : Math.round(value),
        typeof minimum === "number" ? minimum : 1,
        typeof maximum === "number" ? maximum : Number.MAX_SAFE_INTEGER,
      )
      // A drag can move by whole pixels yet resolve back to the saved value
      // (width rounds to a percentage of the parent); dispatching that
      // identical value would spuriously dirty the page
      if (typeof savedValue === "number" && committed === savedValue) {
        return
      }
      handleChange(path, committed)
      setResizeCount((count) => count + 1)
    }

    canvas.addEventListener("mousedown", grabHandle)
    previewWindow.addEventListener("mouseup", commitResize)
    if (dimension === "height") {
      previewWindow.addEventListener("mousemove", trackResize)
    }
    return () => {
      canvas.removeEventListener("mousedown", grabHandle)
      previewWindow.removeEventListener("mouseup", commitResize)
      previewWindow.removeEventListener("mousemove", trackResize)
      dropBadge()
    }
  }, [
    visible,
    enabled,
    dimension,
    minimum,
    maximum,
    path,
    savedValue,
    handleChange,
    locateCanvas,
    badgeColor,
  ])

  return resizeCount
}

function JsonFormsCanvasSizeControl(props: ControlProps) {
  const dimension =
    props.path.split(".").at(-1) === "width" ? "width" : "height"
  usePreviewCanvasResizeAffordance(props, dimension)
  const previewResizeCount = useCommitPreviewCanvasResize(props)

  return (
    <>
      <JsonFormsIntegerControl key={previewResizeCount} {...props} />
      {/* One hint for both size fields, under the last of them */}
      {dimension === "height" && (
        <Text mt="0.5rem" textStyle="body-2" textColor="base.content.medium">
          You can also resize the canvas freely by dragging the handle at its
          bottom-right corner in the page preview. Hold Shift while dragging to
          snap the size to 5% and 25px steps.
        </Text>
      )}
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsCanvasSizeControl)
