import { CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE } from "@opengovsg/isomer-components"
import { useEffect, useMemo } from "react"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import { findCanvasPreviewContainer } from "../../../utils/canvasPreviewBlock"

// The canvas form binds its child blocks array at this root-level path; nested
// arrays inside child forms have dotted paths and must not become click targets
const CANVAS_BLOCKS_PATH = "blocks"

interface UseCanvasPreviewClickToEditArgs {
  path: string
  selectedIndex: number | undefined
  setSelectedIndex: (selectedIndex?: number) => void
}

// While the canvas editor is open, the blocks rendered in the live preview
// act as click targets: clicking one opens (or switches to) its nested item
// editor, mirroring Wix's select-on-canvas interaction. The currently edited
// block is excluded — the placement control owns its preview interactions —
// and the hook is a no-op for every non-canvas array control.
export const useCanvasPreviewClickToEdit = ({
  path,
  selectedIndex,
  setSelectedIndex,
}: UseCanvasPreviewClickToEditArgs): void => {
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

  useEffect(() => {
    if (canvasOrdinal === null || path !== CANVAS_BLOCKS_PATH) {
      return
    }
    const canvas = findCanvasPreviewContainer(document, canvasOrdinal)
    if (!canvas) {
      return
    }

    // The edited block is not a click target: the placement control owns its
    // cursor (move) and pointer interactions while its editor is open
    const clickTargets = Array.from(
      canvas.querySelectorAll<HTMLElement>(
        `[${CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE}]`,
      ),
    ).filter(
      (element) =>
        Number(element.getAttribute(CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE)) !==
        selectedIndex,
    )
    const previousCursors = clickTargets.map((element) => element.style.cursor)
    clickTargets.forEach((element) => {
      element.style.cursor = "pointer"
    })

    const openBlockEditor = (event: MouseEvent) => {
      // The preview lives in an iframe, so the target belongs to that realm
      // and cannot be narrowed with the editor window's instanceof checks
      const target = event.target as Partial<Element> | null
      const block =
        typeof target?.closest === "function"
          ? target.closest(`[${CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE}]`)
          : null
      if (!block) {
        return
      }
      const index = Number(
        block.getAttribute(CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE),
      )
      if (!Number.isInteger(index) || index < 0) {
        return
      }
      // Links inside the block should open its editor, not navigate the preview
      event.preventDefault()
      if (index !== selectedIndex) {
        setSelectedIndex(index)
      }
    }

    canvas.addEventListener("click", openBlockEditor)
    return () => {
      canvas.removeEventListener("click", openBlockEditor)
      clickTargets.forEach((element, index) => {
        element.style.cursor = previousCursors[index] ?? ""
      })
    }
  }, [canvasOrdinal, content, path, selectedIndex, setSelectedIndex])
}
