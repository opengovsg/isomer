import { CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE } from "@opengovsg/isomer-components"
import { useEffect, useMemo } from "react"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import {
  findCanvasPreviewContainer,
  isEditableTarget,
} from "../../../utils/canvasPreviewBlock"
import { setCanvasPreviewGrabHandoff } from "../../../utils/canvasPreviewGrabHandoff"

// The canvas form binds its child blocks array at this root-level path; nested
// arrays inside child forms have dotted paths and must not become click targets
const CANVAS_BLOCKS_PATH = "blocks"

interface UseCanvasPreviewClickToEditArgs {
  path: string
  selectedIndex: number | undefined
  setSelectedIndex: (selectedIndex?: number) => void
  removeSelectedItem: (path: string, index: number) => () => void
}

// While the canvas editor is open, the blocks rendered in the live preview
// act as click targets: clicking one opens (or switches to) its nested item
// editor, and clicking the empty canvas background deselects back to the
// block list, mirroring Wix's select-on-canvas interaction. The currently
// edited block is excluded — the placement control owns its preview
// interactions — and the hook is a no-op for every non-canvas array control.
// While a block is selected, Delete/Backspace removes it from the canvas.
export const useCanvasPreviewClickToEdit = ({
  path,
  selectedIndex,
  setSelectedIndex,
  removeSelectedItem,
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

    const resolveBlock = (event: MouseEvent) => {
      // The preview lives in an iframe, so the target belongs to that realm
      // and cannot be narrowed with the editor window's instanceof checks
      const target = event.target as Partial<Element> | null
      return typeof target?.closest === "function"
        ? target.closest(`[${CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE}]`)
        : null
    }

    // Deselect only when the press also started outside every block: a block
    // drag released over the background fires its click at the canvas
    // ancestor too, and must not close the editor. Capture phase, because the
    // placement control stops propagation of presses on the edited block.
    let deselectArmed = false
    const armDeselect = (event: MouseEvent) => {
      deselectArmed = resolveBlock(event) === null
    }

    // Selecting on press (not on click) lets the same gesture continue as a
    // placement drag, Wix-style: the in-flight press is handed to the newly
    // mounted placement control, which resumes it as a grab. Presses on the
    // already-selected block never arrive here — the placement control stops
    // their propagation.
    const grabToSelect = (event: MouseEvent) => {
      if (event.button !== 0) {
        return
      }
      const block = resolveBlock(event)
      if (!block) {
        return
      }
      const index = Number(
        block.getAttribute(CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE),
      )
      if (!Number.isInteger(index) || index < 0 || index === selectedIndex) {
        return
      }
      // Keep the preview content from starting native drags or text selection
      event.preventDefault()
      setCanvasPreviewGrabHandoff(
        { blockIndex: index, clientX: event.clientX, clientY: event.clientY },
        canvas.ownerDocument.defaultView ?? window,
      )
      setSelectedIndex(index)
    }

    const openBlockEditor = (event: MouseEvent) => {
      const block = resolveBlock(event)
      if (!block) {
        if (deselectArmed && selectedIndex !== undefined) {
          setSelectedIndex(undefined)
        }
        deselectArmed = false
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

    canvas.addEventListener("mousedown", armDeselect, true)
    canvas.addEventListener("mousedown", grabToSelect)
    canvas.addEventListener("click", openBlockEditor)
    return () => {
      canvas.removeEventListener("mousedown", armDeselect, true)
      canvas.removeEventListener("mousedown", grabToSelect)
      canvas.removeEventListener("click", openBlockEditor)
      clickTargets.forEach((element, index) => {
        element.style.cursor = previousCursors[index] ?? ""
      })
    }
  }, [canvasOrdinal, content, path, selectedIndex, setSelectedIndex])

  // Wix-style keyboard removal: while a block's nested editor is open, Delete
  // or Backspace removes the block from the canvas and returns to the block
  // list (keystrokes aimed at a form field keep their editing meaning).
  // Registered on both windows so it works whether focus sits in the drawer
  // or in the preview iframe.
  useEffect(() => {
    if (
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH ||
      selectedIndex === undefined
    ) {
      return
    }
    const removeOnDeleteKey = (event: KeyboardEvent) => {
      if (
        (event.key !== "Delete" && event.key !== "Backspace") ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isEditableTarget(event.target)
      ) {
        return
      }
      event.preventDefault()
      removeSelectedItem(path, selectedIndex)()
    }
    window.addEventListener("keydown", removeOnDeleteKey)
    const previewWindow =
      findCanvasPreviewContainer(document, canvasOrdinal)?.ownerDocument
        .defaultView ?? null
    const foreignPreviewWindow = previewWindow === window ? null : previewWindow
    foreignPreviewWindow?.addEventListener("keydown", removeOnDeleteKey)
    return () => {
      window.removeEventListener("keydown", removeOnDeleteKey)
      foreignPreviewWindow?.removeEventListener("keydown", removeOnDeleteKey)
    }
  }, [canvasOrdinal, path, selectedIndex, removeSelectedItem])
}
