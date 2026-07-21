import { useToken } from "@chakra-ui/react"
import { composePaths, Resolve, update } from "@jsonforms/core"
import { useJsonForms } from "@jsonforms/react"
import {
  CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE,
  CANVAS_GRID_COLUMNS,
} from "@opengovsg/isomer-components"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BLOCK_TO_META } from "~/components/PageEditor/constants"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import type {
  CanvasGridCell,
  CanvasSelectionToolbarAction,
} from "../../../utils/canvasPreviewBlock"
import {
  CANVAS_CONTEXT_MENU_DATA_ATTRIBUTE,
  CANVAS_GRID_OVERLAY_DATA_ATTRIBUTE,
  CANVAS_MAX_ROW,
  findCanvasBlockPreviewElement,
  findCanvasPreviewContainer,
  isEditableTarget,
  resolveCanvasGridCellFromPoint,
  showCanvasContextMenu,
  showCanvasHoverLabel,
  showCanvasSelectionToolbar,
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
  moveUp?: (path: string, index: number) => () => void
  moveDown?: (path: string, index: number) => () => void
}

interface CanvasBlockPlacement {
  colStart?: number
  colSpan?: number
  rowStart?: number
  rowSpan?: number
}

// In-memory clipboard for canvas blocks, module-level so a copied block
// survives selection changes, editor reopens, and pastes into other canvases
// (every canvas shares the same child-block union). The OS clipboard is left
// alone: block JSON there would clobber the text users expect ⌘C to own.
let canvasBlockClipboard: unknown = null

export const resetCanvasBlockClipboard = (): void => {
  canvasBlockClipboard = null
}

// A copied or pasted block lands one row below its source so it is visible
// instead of stacking invisibly on the original, clamped to stay on the grid
const shiftPlacementOneRowDown = (block: {
  placement?: CanvasBlockPlacement
}): void => {
  const placement = block.placement
  if (placement?.rowStart !== undefined) {
    const rowSpan = placement.rowSpan ?? 1
    placement.rowStart = Math.min(
      placement.rowStart + 1,
      CANVAS_MAX_ROW - rowSpan + 1,
    )
  }
}

// A live (non-collapsed) text selection means ⌘C/⌘X should keep their native
// copy meaning; the selection lives in whichever document the keystroke
// targeted, which may be the preview iframe's realm, so duck-type throughout
const hasTextSelection = (target: EventTarget | null): boolean => {
  const node = target as Partial<Node> | null
  const doc = (node?.ownerDocument ?? node) as Partial<Document> | null
  const selection =
    typeof doc?.getSelection === "function" ? doc.getSelection() : null
  return selection !== null && !selection.isCollapsed
}

// While the canvas editor is open, the blocks rendered in the live preview
// act as click targets: clicking one opens (or switches to) its nested item
// editor, and clicking the empty canvas background deselects back to the
// block list, mirroring Wix's select-on-canvas interaction. The currently
// edited block is excluded — the placement control owns its preview
// interactions — and the hook is a no-op for every non-canvas array control.
// While a block is selected, Delete/Backspace removes it from the canvas,
// ⌘D/Ctrl+D duplicates it, ⌘C/⌘X copy or cut it to an in-memory block
// clipboard pasted back (with or without a selection) by ⌘V, ⌘]/⌘[ (or Ctrl)
// move it forward/backward in the stacking order, and ⌘⇧]/⌘⇧[ jump it to the
// front/back of the stack. Holding Alt (⌥) while pressing any block leaves a
// copy of it in place while the press drags the original away, Wix-style.
// The right-click context menu offers the same clipboard commands plus
// Wix's align commands, repositioning a placed block's columns against the
// left/centre/right of the grid or stretching it across the full width.
export const useCanvasPreviewClickToEdit = ({
  path,
  selectedIndex,
  setSelectedIndex,
  removeSelectedItem,
  addItem,
  moveUp,
  moveDown,
}: UseCanvasPreviewClickToEditArgs): void => {
  const { core: jsonFormsCore, dispatch } = useJsonForms()
  const [hoverColor] = useToken("colors", ["interaction.main.default"])
  // Preview-viewport coordinates of an open right-click context menu: on a
  // block it offers the selection actions, on the empty canvas background it
  // offers Wix's "paste here" targeting the right-clicked grid cell
  const [contextMenu, setContextMenu] = useState<
    | { variant: "block"; clientX: number; clientY: number }
    | {
        variant: "background"
        clientX: number
        clientY: number
        cell: CanvasGridCell
      }
    | null
  >(null)
  const editorContext = useOptionalEditorDrawerContext()
  const content = editorContext?.previewPageState.content
  const currActiveIdx = editorContext?.currActiveIdx

  // Latest-ref of the canvas's child blocks, so the selection actions below
  // keep stable identities (effects using them must not re-register on every
  // form keystroke) while still acting on current data
  const blocksRef = useRef<unknown[]>([])
  const resolvedBlocks: unknown = Resolve.data(jsonFormsCore?.data, path)
  blocksRef.current = Array.isArray(resolvedBlocks) ? resolvedBlocks : []

  // The selection actions shared by the keyboard shortcuts and the preview
  // toolbar: duplicate appends a deep copy (its placement shifted one row
  // down so the copy is visible instead of stacking invisibly on the
  // original) and switches the editor to it; the arrange actions move the
  // block one step through the blocks array — overlapping blocks paint in
  // source order, so this is the stacking-order control — with the editor
  // following the moved block.
  const duplicateSelectedBlock = useCallback(() => {
    if (selectedIndex === undefined) {
      return
    }
    const source: unknown = blocksRef.current[selectedIndex]
    if (source === undefined || source === null) {
      return
    }
    const copy = structuredClone(source) as {
      placement?: CanvasBlockPlacement
    }
    shiftPlacementOneRowDown(copy)
    addItem(path, copy)()
    setSelectedIndex(blocksRef.current.length)
  }, [selectedIndex, path, addItem, setSelectedIndex])

  // The clipboard actions behind ⌘C/⌘X/⌘V: copy snapshots the selected block
  // into the module-level clipboard, cut also removes it, and paste appends a
  // clone with its placement shifted one row down — re-snapshotting the
  // shifted clone so successive pastes cascade down the grid instead of
  // stacking on one spot — and switches the editor to the pasted block.
  const copySelectedBlock = useCallback(() => {
    if (selectedIndex === undefined) {
      return false
    }
    const source: unknown = blocksRef.current[selectedIndex]
    if (source === undefined || source === null) {
      return false
    }
    canvasBlockClipboard = structuredClone(source)
    return true
  }, [selectedIndex])

  const cutSelectedBlock = useCallback(() => {
    if (selectedIndex !== undefined && copySelectedBlock()) {
      removeSelectedItem(path, selectedIndex)()
    }
  }, [copySelectedBlock, removeSelectedItem, path, selectedIndex])

  const pasteBlockFromClipboard = useCallback(() => {
    if (canvasBlockClipboard === null) {
      return
    }
    const copy = structuredClone(canvasBlockClipboard) as {
      placement?: CanvasBlockPlacement
    }
    shiftPlacementOneRowDown(copy)
    canvasBlockClipboard = structuredClone(copy)
    addItem(path, copy)()
    setSelectedIndex(blocksRef.current.length)
  }, [path, addItem, setSelectedIndex])

  // Wix's "paste here": the clipboard block lands with its top-left corner
  // on the grid cell that was right-clicked, keeping its span (clamped so the
  // block stays on the grid); an unplaced clipboard block stays full width
  // and is pinned at the clicked row. The clipboard re-snapshots the placed
  // copy so a follow-up ⌘V cascades from the pasted position.
  const pasteBlockHereFromClipboard = useCallback(
    (cell: CanvasGridCell) => {
      if (canvasBlockClipboard === null) {
        return
      }
      const copy = structuredClone(canvasBlockClipboard) as {
        placement?: CanvasBlockPlacement
      }
      const colSpan = copy.placement?.colSpan ?? CANVAS_GRID_COLUMNS
      const rowSpan = copy.placement?.rowSpan ?? 1
      copy.placement = {
        ...copy.placement,
        colStart: Math.min(cell.col, CANVAS_GRID_COLUMNS - colSpan + 1),
        colSpan,
        rowStart: Math.min(cell.row, CANVAS_MAX_ROW - rowSpan + 1),
        rowSpan,
      }
      canvasBlockClipboard = structuredClone(copy)
      addItem(path, copy)()
      setSelectedIndex(blocksRef.current.length)
    },
    [path, addItem, setSelectedIndex],
  )

  const removeSelectedBlock = useCallback(() => {
    if (selectedIndex === undefined) {
      return
    }
    removeSelectedItem(path, selectedIndex)()
  }, [selectedIndex, path, removeSelectedItem])

  const bringSelectedForward = useCallback(() => {
    if (
      selectedIndex === undefined ||
      !moveDown ||
      selectedIndex >= blocksRef.current.length - 1
    ) {
      return
    }
    moveDown(path, selectedIndex)()
    setSelectedIndex(selectedIndex + 1)
  }, [selectedIndex, path, moveDown, setSelectedIndex])

  const sendSelectedBackward = useCallback(() => {
    if (selectedIndex === undefined || !moveUp || selectedIndex <= 0) {
      return
    }
    moveUp(path, selectedIndex)()
    setSelectedIndex(selectedIndex - 1)
  }, [selectedIndex, path, moveUp, setSelectedIndex])

  // The to-front/to-back variants step through the array one move per
  // dispatch: each JsonForms update carries a function of the previous
  // dispatch's data, so the chain composes within one React batch
  const bringSelectedToFront = useCallback(() => {
    const lastIndex = blocksRef.current.length - 1
    if (
      selectedIndex === undefined ||
      !moveDown ||
      selectedIndex >= lastIndex
    ) {
      return
    }
    for (let index = selectedIndex; index < lastIndex; index++) {
      moveDown(path, index)()
    }
    setSelectedIndex(lastIndex)
  }, [selectedIndex, path, moveDown, setSelectedIndex])

  const sendSelectedToBack = useCallback(() => {
    if (selectedIndex === undefined || !moveUp || selectedIndex <= 0) {
      return
    }
    for (let index = selectedIndex; index > 0; index--) {
      moveUp(path, index)()
    }
    setSelectedIndex(0)
  }, [selectedIndex, path, moveUp, setSelectedIndex])

  // Wix's align-to-section commands: reposition the selected block's columns
  // against the left/centre/right of the grid, or stretch it across the full
  // width, leaving its rows untouched. Only meaningful for a block with a
  // column placement (an unplaced block already spans the full width), and
  // aligning a block to the position it already holds commits nothing so the
  // command can never spuriously dirty the page.
  const alignSelectedBlock = useCallback(
    (alignment: "left" | "center" | "right" | "stretch") => {
      if (selectedIndex === undefined || !dispatch) {
        return
      }
      const source = blocksRef.current[selectedIndex] as
        | { placement?: CanvasBlockPlacement }
        | undefined
      const placement = source?.placement
      if (
        placement?.colStart === undefined ||
        placement.colSpan === undefined
      ) {
        return
      }
      const colSpan =
        alignment === "stretch" ? CANVAS_GRID_COLUMNS : placement.colSpan
      const colStart =
        alignment === "left" || alignment === "stretch"
          ? 1
          : alignment === "right"
            ? CANVAS_GRID_COLUMNS - colSpan + 1
            : Math.floor((CANVAS_GRID_COLUMNS - colSpan) / 2) + 1
      if (colStart === placement.colStart && colSpan === placement.colSpan) {
        return
      }
      dispatch(
        update(
          composePaths(composePaths(path, `${selectedIndex}`), "placement"),
          () => ({ ...placement, colStart, colSpan }),
        ),
      )
    },
    [selectedIndex, path, dispatch],
  )

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
    // outline and a chip naming the block's type, Wix-style. The outline
    // hands over to the placement control's solid selection highlight when
    // the block is selected (React runs this effect's cleanup before the
    // highlight effect's setup), and is skipped while a mouse button is held
    // so a placement drag passing over a sibling does not flash outlines.
    const canvasPageBlock =
      content !== undefined && currActiveIdx !== undefined
        ? content[currActiveIdx]
        : undefined
    const childBlocks =
      canvasPageBlock?.type === "canvas" ? canvasPageBlock.blocks : []
    let hovered: HTMLElement | null = null
    let hoveredOutline = ""
    let hoveredOutlineOffset = ""
    let removeHoverLabel: (() => void) | null = null
    const clearHover = () => {
      if (!hovered) {
        return
      }
      hovered.style.outline = hoveredOutline
      hovered.style.outlineOffset = hoveredOutlineOffset
      hovered = null
      removeHoverLabel?.()
      removeHoverLabel = null
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
      const child = childBlocks[index]
      if (child) {
        removeHoverLabel = showCanvasHoverLabel(
          target,
          BLOCK_TO_META[child.type].label,
          hoverColor,
        )
      }
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

    // Holding Alt (⌥) while pressing a block leaves a copy of it behind,
    // Wix/Figma-style: the clone keeps the pressed block's exact placement
    // and is appended at the end of the blocks array — so no indices shift
    // and the press continues untouched into the usual machinery, moving the
    // ORIGINAL block away while the copy stays in place. Capture phase,
    // because presses on the selected block stop propagation in the
    // placement control's grab handler before they would reach this hook.
    const duplicateOnAltPress = (event: MouseEvent) => {
      if (event.button !== 0 || !event.altKey) {
        return
      }
      const block = resolveBlock(event)
      if (!block) {
        return
      }
      const index = Number(
        block.getAttribute(CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE),
      )
      if (!Number.isInteger(index) || index < 0) {
        return
      }
      const source: unknown = blocksRef.current[index]
      if (source === undefined || source === null) {
        return
      }
      addItem(path, structuredClone(source))()
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

    // Right-clicking a block selects it and opens the context menu at the
    // pointer, Wix-style. Right-clicking the empty canvas background offers
    // "paste here" targeting the right-clicked grid cell when the block
    // clipboard holds something; otherwise the browser's native menu is kept.
    const openContextMenu = (event: MouseEvent) => {
      const block = resolveBlock(event)
      if (!block) {
        if (canvasBlockClipboard === null) {
          return
        }
        const cell = resolveCanvasGridCellFromPoint(
          canvas,
          event.clientX,
          event.clientY,
        )
        if (!cell) {
          return
        }
        event.preventDefault()
        setContextMenu({
          variant: "background",
          clientX: event.clientX,
          clientY: event.clientY,
          cell,
        })
        return
      }
      const index = Number(
        block.getAttribute(CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE),
      )
      if (!Number.isInteger(index) || index < 0) {
        return
      }
      event.preventDefault()
      if (index !== selectedIndex) {
        setSelectedIndex(index)
      }
      setContextMenu({
        variant: "block",
        clientX: event.clientX,
        clientY: event.clientY,
      })
    }

    canvas.addEventListener("mousedown", duplicateOnAltPress, true)
    canvas.addEventListener("mousedown", armDeselect, true)
    canvas.addEventListener("mousedown", grabToSelect)
    canvas.addEventListener("click", openBlockEditor)
    canvas.addEventListener("contextmenu", openContextMenu)
    canvas.addEventListener("mouseover", hoverBlock)
    canvas.addEventListener("mouseout", unhoverBlock)
    return () => {
      canvas.removeEventListener("mousedown", duplicateOnAltPress, true)
      canvas.removeEventListener("mousedown", armDeselect, true)
      canvas.removeEventListener("mousedown", grabToSelect)
      canvas.removeEventListener("click", openBlockEditor)
      canvas.removeEventListener("contextmenu", openContextMenu)
      canvas.removeEventListener("mouseover", hoverBlock)
      canvas.removeEventListener("mouseout", unhoverBlock)
      clearHover()
      clickTargets.forEach((element, index) => {
        element.style.cursor = previousCursors[index] ?? ""
      })
    }
  }, [
    addItem,
    canvasOrdinal,
    content,
    currActiveIdx,
    hoverColor,
    path,
    selectedIndex,
    setSelectedIndex,
  ])

  // Wix-style keyboard shortcuts while a block's nested editor is open:
  // Delete or Backspace removes the block from the canvas and returns to the
  // block list, ⌘D/Ctrl+D appends a copy of the block (its placement
  // shifted one row down so the copy is visible) and switches the editor to
  // it, ⌘]/⌘[ (or Ctrl) move the block one step forward/backward in the
  // blocks array — overlapping blocks paint in source order, so this is the
  // stacking-order control — with Shift jumping it all the way to the
  // front/back of the stack, and Escape deselects back to the block list
  // (unless a placement drag is in progress — the placement control owns
  // Escape as its drag cancel).
  // Keystrokes aimed at a form field keep their editing meaning.
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
      removeSelectedBlock()
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
      // Take over the keystroke even from the browser's bookmark shortcut
      event.preventDefault()
      duplicateSelectedBlock()
    }
    const arrangeOnKey = (event: KeyboardEvent) => {
      // Shift+]/[ arrive as }/{ on US layouts
      const key = event.key === "}" ? "]" : event.key === "{" ? "[" : event.key
      if (
        (key !== "]" && key !== "[") ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return
      }
      // Take over the keystroke even when the move clamps at the end of the
      // stack: ⌘[/⌘] are browser history-navigation shortcuts, which must
      // never fire while a block is selected
      event.preventDefault()
      if (key === "]") {
        if (event.shiftKey) {
          bringSelectedToFront()
        } else {
          bringSelectedForward()
        }
      } else if (event.shiftKey) {
        sendSelectedToBack()
      } else {
        sendSelectedBackward()
      }
    }
    const deselectOnEscape = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.defaultPrevented ||
        isEditableTarget(event.target)
      ) {
        return
      }
      // While a placement drag is active, Escape means "cancel the drag";
      // the placement control's capture-phase listener usually intercepts
      // the event first, but a keydown targeting the preview window itself
      // reaches both listeners, so the drag's grid-guide overlay is the
      // reliable in-progress marker. Likewise, while the context menu is
      // open Escape means "close the menu" (its own listener handles that),
      // keeping the block selected.
      const previewCanvas = findCanvasPreviewContainer(document, canvasOrdinal)
      if (
        previewCanvas?.querySelector(
          `[${CANVAS_GRID_OVERLAY_DATA_ATTRIBUTE}]`,
        ) ??
        previewCanvas?.ownerDocument.querySelector(
          `[${CANVAS_CONTEXT_MENU_DATA_ATTRIBUTE}]`,
        )
      ) {
        return
      }
      event.preventDefault()
      setSelectedIndex(undefined)
    }
    const handleShortcut = (event: KeyboardEvent) => {
      removeOnDeleteKey(event)
      duplicateOnKey(event)
      arrangeOnKey(event)
      deselectOnEscape(event)
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
    removeSelectedBlock,
    duplicateSelectedBlock,
    bringSelectedForward,
    sendSelectedBackward,
    bringSelectedToFront,
    sendSelectedToBack,
    setSelectedIndex,
  ])

  // Wix-style clipboard shortcuts, active whenever the canvas editor is open
  // (paste needs no selection, so this cannot live in the selection-gated
  // effect above): ⌘C/Ctrl+C copies the selected block into the in-memory
  // block clipboard, ⌘X cuts it, and ⌘V pastes the clipboard block one row
  // below its source, switching the editor to the pasted copy. Keystrokes in
  // form fields and copies of a live text selection keep their native
  // clipboard meaning, and an empty block clipboard leaves ⌘V untouched.
  useEffect(() => {
    if (canvasOrdinal === null || path !== CANVAS_BLOCKS_PATH) {
      return
    }
    const clipboardOnKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (
        (key !== "c" && key !== "x" && key !== "v") ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.shiftKey ||
        isEditableTarget(event.target)
      ) {
        return
      }
      if (key === "v") {
        if (canvasBlockClipboard === null) {
          return
        }
        event.preventDefault()
        pasteBlockFromClipboard()
        return
      }
      if (selectedIndex === undefined || hasTextSelection(event.target)) {
        return
      }
      event.preventDefault()
      if (key === "c") {
        copySelectedBlock()
      } else {
        cutSelectedBlock()
      }
    }
    window.addEventListener("keydown", clipboardOnKey)
    const previewWindow =
      findCanvasPreviewContainer(document, canvasOrdinal)?.ownerDocument
        .defaultView ?? null
    const foreignPreviewWindow = previewWindow === window ? null : previewWindow
    foreignPreviewWindow?.addEventListener("keydown", clipboardOnKey)
    return () => {
      window.removeEventListener("keydown", clipboardOnKey)
      foreignPreviewWindow?.removeEventListener("keydown", clipboardOnKey)
    }
  }, [
    canvasOrdinal,
    path,
    selectedIndex,
    copySelectedBlock,
    cutSelectedBlock,
    pasteBlockFromClipboard,
  ])

  // Wix-style action toolbar pinned above the selected block in the live
  // preview: mouse-discoverable buttons for the same selection actions as
  // the keyboard shortcuts. The arrange buttons disable at the ends of the
  // stack; the effect re-runs on selection changes, which every action that
  // changes the block count also triggers, so the disabled states read a
  // current count from the latest-ref.
  useEffect(() => {
    if (
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH ||
      selectedIndex === undefined
    ) {
      return
    }
    const block = findCanvasBlockPreviewElement(
      document,
      canvasOrdinal,
      selectedIndex,
    )
    if (!block) {
      return
    }
    return showCanvasSelectionToolbar(
      block,
      [
        {
          name: "duplicate",
          label: "Duplicate block (⌘D)",
          glyph: "⧉",
          onClick: duplicateSelectedBlock,
        },
        {
          name: "bring-forward",
          label: "Bring forward (⌘])",
          glyph: "▲",
          disabled: selectedIndex >= blocksRef.current.length - 1,
          onClick: bringSelectedForward,
        },
        {
          name: "send-backward",
          label: "Send backward (⌘[)",
          glyph: "▼",
          disabled: selectedIndex <= 0,
          onClick: sendSelectedBackward,
        },
        {
          name: "delete",
          label: "Delete block (Delete)",
          glyph: "✕",
          onClick: removeSelectedBlock,
        },
      ],
      hoverColor,
    )
  }, [
    canvasOrdinal,
    path,
    selectedIndex,
    hoverColor,
    duplicateSelectedBlock,
    bringSelectedForward,
    sendSelectedBackward,
    removeSelectedBlock,
  ])

  // Wix-style right-click context menu: on a block, the same selection
  // actions as the toolbar and the keyboard shortcuts; on the empty canvas
  // background, "paste here" targeting the right-clicked grid cell. Opened
  // at the pointer by the contextmenu handler above, dismissed by pressing
  // anywhere outside the menu or by Escape — which closes only the menu,
  // keeping any selection — and invoking an action closes it before acting.
  useEffect(() => {
    if (contextMenu === null) {
      return
    }
    if (canvasOrdinal === null || path !== CANVAS_BLOCKS_PATH) {
      setContextMenu(null)
      return
    }
    const canvas = findCanvasPreviewContainer(document, canvasOrdinal)
    if (!canvas) {
      setContextMenu(null)
      return
    }
    const closeMenu = () => setContextMenu(null)
    const withClose = (action: () => void) => () => {
      closeMenu()
      action()
    }
    let items: CanvasSelectionToolbarAction[]
    if (contextMenu.variant === "background") {
      const { cell } = contextMenu
      items = [
        {
          name: "paste-here",
          label: "Paste block here",
          glyph: "⇲",
          disabled: canvasBlockClipboard === null,
          onClick: withClose(() => pasteBlockHereFromClipboard(cell)),
        },
      ]
    } else if (selectedIndex === undefined) {
      // The selection went away underneath an open menu (e.g. the block was
      // deleted) — drop the stale menu state
      setContextMenu(null)
      return
    } else {
      // The align commands need a column placement to act on; an unplaced
      // block already spans the full width
      const selectedBlock = blocksRef.current[selectedIndex] as
        | { placement?: CanvasBlockPlacement }
        | undefined
      const canAlign =
        selectedBlock?.placement?.colStart !== undefined &&
        selectedBlock.placement.colSpan !== undefined
      items = [
        {
          name: "duplicate",
          label: "Duplicate block (⌘D)",
          glyph: "⧉",
          onClick: withClose(duplicateSelectedBlock),
        },
        {
          name: "copy",
          label: "Copy block (⌘C)",
          glyph: "⿻",
          onClick: withClose(() => {
            copySelectedBlock()
          }),
        },
        {
          name: "cut",
          label: "Cut block (⌘X)",
          glyph: "✂",
          onClick: withClose(cutSelectedBlock),
        },
        {
          name: "paste",
          label: "Paste block (⌘V)",
          glyph: "⇲",
          disabled: canvasBlockClipboard === null,
          onClick: withClose(pasteBlockFromClipboard),
        },
        {
          name: "bring-forward",
          label: "Bring forward (⌘])",
          glyph: "▲",
          disabled: selectedIndex >= blocksRef.current.length - 1,
          onClick: withClose(bringSelectedForward),
        },
        {
          name: "bring-to-front",
          label: "Bring to front (⌘⇧])",
          glyph: "⤒",
          disabled: selectedIndex >= blocksRef.current.length - 1,
          onClick: withClose(bringSelectedToFront),
        },
        {
          name: "send-backward",
          label: "Send backward (⌘[)",
          glyph: "▼",
          disabled: selectedIndex <= 0,
          onClick: withClose(sendSelectedBackward),
        },
        {
          name: "send-to-back",
          label: "Send to back (⌘⇧[)",
          glyph: "⤓",
          disabled: selectedIndex <= 0,
          onClick: withClose(sendSelectedToBack),
        },
        {
          name: "align-left",
          label: "Align left",
          glyph: "⇤",
          disabled: !canAlign,
          onClick: withClose(() => alignSelectedBlock("left")),
        },
        {
          name: "align-center",
          label: "Align center",
          glyph: "↔",
          disabled: !canAlign,
          onClick: withClose(() => alignSelectedBlock("center")),
        },
        {
          name: "align-right",
          label: "Align right",
          glyph: "⇥",
          disabled: !canAlign,
          onClick: withClose(() => alignSelectedBlock("right")),
        },
        {
          name: "stretch",
          label: "Stretch to full width",
          glyph: "⇔",
          disabled: !canAlign,
          onClick: withClose(() => alignSelectedBlock("stretch")),
        },
        {
          name: "delete",
          label: "Delete block (Delete)",
          glyph: "✕",
          onClick: withClose(removeSelectedBlock),
        },
      ]
    }
    const removeMenu = showCanvasContextMenu(
      canvas.ownerDocument,
      contextMenu,
      items,
      hoverColor,
    )

    // Any press outside the menu dismisses it — capture phase on both
    // windows, because presses on the preview canvas and its blocks stop
    // propagation in the bubble phase
    const dismissOnPress = (event: MouseEvent) => {
      const target = event.target as Partial<Element> | null
      const insideMenu =
        typeof target?.closest === "function" &&
        target.closest(`[${CANVAS_CONTEXT_MENU_DATA_ATTRIBUTE}]`) !== null
      if (!insideMenu) {
        closeMenu()
      }
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return
      }
      // Escape closes only the menu; the deselect handler defers to an open
      // menu, so the block stays selected
      event.preventDefault()
      closeMenu()
    }
    const previewWindow = canvas.ownerDocument.defaultView
    const foreignPreviewWindow = previewWindow === window ? null : previewWindow
    window.addEventListener("mousedown", dismissOnPress, true)
    foreignPreviewWindow?.addEventListener("mousedown", dismissOnPress, true)
    window.addEventListener("keydown", dismissOnEscape, true)
    foreignPreviewWindow?.addEventListener("keydown", dismissOnEscape, true)
    return () => {
      removeMenu()
      window.removeEventListener("mousedown", dismissOnPress, true)
      foreignPreviewWindow?.removeEventListener(
        "mousedown",
        dismissOnPress,
        true,
      )
      window.removeEventListener("keydown", dismissOnEscape, true)
      foreignPreviewWindow?.removeEventListener(
        "keydown",
        dismissOnEscape,
        true,
      )
    }
  }, [
    contextMenu,
    canvasOrdinal,
    path,
    selectedIndex,
    hoverColor,
    duplicateSelectedBlock,
    copySelectedBlock,
    cutSelectedBlock,
    pasteBlockFromClipboard,
    pasteBlockHereFromClipboard,
    bringSelectedForward,
    sendSelectedBackward,
    bringSelectedToFront,
    sendSelectedToBack,
    alignSelectedBlock,
    removeSelectedBlock,
  ])
}
