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

// While the canvas editor shows its block list, the blocks rendered in the
// live preview act as click targets: clicking one opens its nested item
// editor, mirroring Wix's select-on-canvas interaction. Inactive while a
// nested editor is open (the placement control owns preview interactions
// then) and for every non-canvas array control.
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
    if (
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH ||
      selectedIndex !== undefined
    ) {
      return
    }
    const canvas = findCanvasPreviewContainer(document, canvasOrdinal)
    if (!canvas) {
      return
    }

    const blockElements = Array.from(
      canvas.querySelectorAll<HTMLElement>(
        `[${CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE}]`,
      ),
    )
    const previousCursors = blockElements.map((element) => element.style.cursor)
    blockElements.forEach((element) => {
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
      setSelectedIndex(index)
    }

    canvas.addEventListener("click", openBlockEditor)
    return () => {
      canvas.removeEventListener("click", openBlockEditor)
      blockElements.forEach((element, index) => {
        element.style.cursor = previousCursors[index] ?? ""
      })
    }
  }, [canvasOrdinal, content, path, selectedIndex, setSelectedIndex])
}
