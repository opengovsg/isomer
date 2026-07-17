import { useToken } from "@chakra-ui/react"
import { Resolve } from "@jsonforms/core"
import { useJsonForms } from "@jsonforms/react"
import { CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE } from "@opengovsg/isomer-components"
import { useEffect, useMemo } from "react"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import {
  CANVAS_MAX_ROW,
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
  addItem: (path: string, value: unknown) => () => void
}

interface CanvasBlockPlacement {
  colStart?: number
  colSpan?: number
  rowStart?: number
  rowSpan?: number
}

// While the canvas editor is open, the blocks rendered in the live preview
// act as click targets: clicking one opens (or switches to) its nested item
// editor, and clicking the empty canvas background deselects back to the
// block list, mirroring Wix's select-on-canvas interaction. The currently
// edited block is excluded — the placement control owns its preview
// interactions — and the hook is a no-op for every non-canvas array control.
// While a block is selected, Delete/Backspace removes it from the canvas
// and ⌘D/Ctrl+D duplicates it.
export const useCanvasPreviewClickToEdit = ({
  path,
  selectedIndex,
  setSelectedIndex,
  removeSelectedItem,
  addItem,
}: UseCanvasPreviewClickToEditArgs): void => {
  const jsonFormsCore = useJsonForms().core
  const [hoverColor] = useToken("colors", ["interaction.main.default"])
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

    // Hovering a click target previews its selectability with a dashed
    // outline, Wix-style. The outline hands over to the placement control's
    // solid selection highlight when the block is selected (React runs this
    // effect's cleanup before the highlight effect's setup), and is skipped
    // while a mouse button is held so a placement drag passing over a
    // sibling does not flash outlines.
    let hovered: HTMLElement | null = null
    let hoveredOutline = ""
    let hoveredOutlineOffset = ""
    const clearHover = () => {
      if (!hovered) {
        return
      }
      hovered.style.outline = hoveredOutline
      hovered.style.outlineOffset = hoveredOutlineOffset
      hovered = null
    }
    const hoverBlock = (event: MouseEvent) => {
      const block =
        event.buttons === 0 ? (resolveBlock(event) as HTMLElement | null) : null
      const index = block
        ? Number(block.getAttribute(CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE))
        : NaN
      const target =
        block && Number.isInteger(index) && index !== selectedIndex
          ? block
          : null
      if (target === hovered) {
        return
      }
      clearHover()
      if (!target) {
        return
      }
      hovered = target
      hoveredOutline = target.style.outline
      hoveredOutlineOffset = target.style.outlineOffset
      target.style.outline = `2px dashed ${hoverColor}`
      target.style.outlineOffset = "2px"
    }
    const unhoverBlock = (event: MouseEvent) => {
      if (!hovered) {
        return
      }
      // Cross-realm relatedTarget: duck-type instead of instanceof (the
      // preview iframe has its own Element prototype)
      const related = event.relatedTarget as Partial<Element> | null
      const stillInside =
        typeof related?.closest === "function" &&
        related.closest(`[${CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE}]`) === hovered
      if (!stillInside) {
        clearHover()
      }
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
    canvas.addEventListener("mouseover", hoverBlock)
    canvas.addEventListener("mouseout", unhoverBlock)
    return () => {
      canvas.removeEventListener("mousedown", armDeselect, true)
      canvas.removeEventListener("mousedown", grabToSelect)
      canvas.removeEventListener("click", openBlockEditor)
      canvas.removeEventListener("mouseover", hoverBlock)
      canvas.removeEventListener("mouseout", unhoverBlock)
      clearHover()
      clickTargets.forEach((element, index) => {
        element.style.cursor = previousCursors[index] ?? ""
      })
    }
  }, [
    canvasOrdinal,
    content,
    hoverColor,
    path,
    selectedIndex,
    setSelectedIndex,
  ])

  // Wix-style keyboard shortcuts while a block's nested editor is open:
  // Delete or Backspace removes the block from the canvas and returns to the
  // block list, and ⌘D/Ctrl+D appends a copy of the block (its placement
  // shifted one row down so the copy is visible) and switches the editor to
  // it. Keystrokes aimed at a form field keep their editing meaning.
  // Registered on both windows so shortcuts work whether focus sits in the
  // drawer or in the preview iframe.
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
    const duplicateOnKey = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "d" ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.shiftKey ||
        isEditableTarget(event.target)
      ) {
        return
      }
      const blocks: unknown = Resolve.data(jsonFormsCore?.data, path)
      if (!Array.isArray(blocks)) {
        return
      }
      const source: unknown = blocks[selectedIndex]
      if (source === undefined || source === null) {
        return
      }
      // Take over the keystroke even from the browser's bookmark shortcut
      event.preventDefault()
      const copy = structuredClone(source) as {
        placement?: CanvasBlockPlacement
      }
      const placement = copy.placement
      if (placement?.rowStart !== undefined) {
        const rowSpan = placement.rowSpan ?? 1
        placement.rowStart = Math.min(
          placement.rowStart + 1,
          CANVAS_MAX_ROW - rowSpan + 1,
        )
      }
      addItem(path, copy)()
      setSelectedIndex(blocks.length)
    }
    const handleShortcut = (event: KeyboardEvent) => {
      removeOnDeleteKey(event)
      duplicateOnKey(event)
    }
    window.addEventListener("keydown", handleShortcut)
    const previewWindow =
      findCanvasPreviewContainer(document, canvasOrdinal)?.ownerDocument
        .defaultView ?? null
    const foreignPreviewWindow = previewWindow === window ? null : previewWindow
    foreignPreviewWindow?.addEventListener("keydown", handleShortcut)
    return () => {
      window.removeEventListener("keydown", handleShortcut)
      foreignPreviewWindow?.removeEventListener("keydown", handleShortcut)
    }
  }, [
    canvasOrdinal,
    path,
    selectedIndex,
    removeSelectedItem,
    addItem,
    setSelectedIndex,
    jsonFormsCore,
  ])
}
