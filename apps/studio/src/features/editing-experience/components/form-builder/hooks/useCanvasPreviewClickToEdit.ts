import { useToken } from "@chakra-ui/react"
import { Resolve } from "@jsonforms/core"
import { useJsonForms } from "@jsonforms/react"
import { CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE } from "@opengovsg/isomer-components"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BLOCK_TO_META } from "~/components/PageEditor/constants"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import {
  CANVAS_CONTEXT_MENU_DATA_ATTRIBUTE,
  CANVAS_GRID_OVERLAY_DATA_ATTRIBUTE,
  CANVAS_MAX_ROW,
  findCanvasBlockPreviewElement,
  findCanvasPreviewContainer,
  isEditableTarget,
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

// While the canvas editor is open, the blocks rendered in the live preview
// act as click targets: clicking one opens (or switches to) its nested item
// editor, and clicking the empty canvas background deselects back to the
// block list, mirroring Wix's select-on-canvas interaction. The currently
// edited block is excluded — the placement control owns its preview
// interactions — and the hook is a no-op for every non-canvas array control.
// While a block is selected, Delete/Backspace removes it from the canvas,
// ⌘D/Ctrl+D duplicates it, and ⌘]/⌘[ (or Ctrl) move it forward/backward
// in the stacking order.
export const useCanvasPreviewClickToEdit = ({
  path,
  selectedIndex,
  setSelectedIndex,
  removeSelectedItem,
  addItem,
  moveUp,
  moveDown,
}: UseCanvasPreviewClickToEditArgs): void => {
  const jsonFormsCore = useJsonForms().core
  const [hoverColor] = useToken("colors", ["interaction.main.default"])
  // Preview-viewport coordinates of an open right-click context menu
  const [contextMenu, setContextMenu] = useState<{
    clientX: number
    clientY: number
  } | null>(null)
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
    const placement = copy.placement
    if (placement?.rowStart !== undefined) {
      const rowSpan = placement.rowSpan ?? 1
      placement.rowStart = Math.min(
        placement.rowStart + 1,
        CANVAS_MAX_ROW - rowSpan + 1,
      )
    }
    addItem(path, copy)()
    setSelectedIndex(blocksRef.current.length)
  }, [selectedIndex, path, addItem, setSelectedIndex])

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
    // pointer, Wix-style; right-clicking the empty canvas background keeps
    // the browser's native menu
    const openContextMenu = (event: MouseEvent) => {
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
      event.preventDefault()
      if (index !== selectedIndex) {
        setSelectedIndex(index)
      }
      setContextMenu({ clientX: event.clientX, clientY: event.clientY })
    }

    canvas.addEventListener("mousedown", armDeselect, true)
    canvas.addEventListener("mousedown", grabToSelect)
    canvas.addEventListener("click", openBlockEditor)
    canvas.addEventListener("contextmenu", openContextMenu)
    canvas.addEventListener("mouseover", hoverBlock)
    canvas.addEventListener("mouseout", unhoverBlock)
    return () => {
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
  // stacking-order control — and Escape deselects back to the block list
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
      if (
        (event.key !== "]" && event.key !== "[") ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.shiftKey ||
        isEditableTarget(event.target)
      ) {
        return
      }
      // Take over the keystroke even when the move clamps at the end of the
      // stack: ⌘[/⌘] are browser history-navigation shortcuts, which must
      // never fire while a block is selected
      event.preventDefault()
      if (event.key === "]") {
        bringSelectedForward()
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
    setSelectedIndex,
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

  // Wix-style right-click context menu: the same selection actions as the
  // toolbar and the keyboard shortcuts, opened at the pointer by the
  // contextmenu handler above. Dismissed by pressing anywhere outside the
  // menu or by Escape — which closes only the menu, keeping the block
  // selected — and invoking an action closes it before acting.
  useEffect(() => {
    if (contextMenu === null) {
      return
    }
    if (
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH ||
      selectedIndex === undefined
    ) {
      // The selection went away underneath an open menu (e.g. the block was
      // deleted) — drop the stale menu state
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
    const removeMenu = showCanvasContextMenu(
      canvas.ownerDocument,
      contextMenu,
      [
        {
          name: "duplicate",
          label: "Duplicate block (⌘D)",
          glyph: "⧉",
          onClick: withClose(duplicateSelectedBlock),
        },
        {
          name: "bring-forward",
          label: "Bring forward (⌘])",
          glyph: "▲",
          disabled: selectedIndex >= blocksRef.current.length - 1,
          onClick: withClose(bringSelectedForward),
        },
        {
          name: "send-backward",
          label: "Send backward (⌘[)",
          glyph: "▼",
          disabled: selectedIndex <= 0,
          onClick: withClose(sendSelectedBackward),
        },
        {
          name: "delete",
          label: "Delete block (Delete)",
          glyph: "✕",
          onClick: withClose(removeSelectedBlock),
        },
      ],
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
    bringSelectedForward,
    sendSelectedBackward,
    removeSelectedBlock,
  ])
}
