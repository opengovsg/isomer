import { useToken } from "@chakra-ui/react"
import { composePaths, Resolve, update } from "@jsonforms/core"
import { useJsonForms } from "@jsonforms/react"
import {
  CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE,
  CANVAS_GRID_COLUMNS,
} from "@opengovsg/isomer-components"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BLOCK_TO_META,
  DEFAULT_BLOCKS,
} from "~/components/PageEditor/constants"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import type {
  CanvasGridCell,
  CanvasMarqueeRectangle,
  CanvasSelectionToolbarAction,
} from "../../../utils/canvasPreviewBlock"
import {
  CANVAS_CONTEXT_MENU_DATA_ATTRIBUTE,
  CANVAS_DRAG_BADGE_DATA_ATTRIBUTE,
  CANVAS_MAX_ROW,
  findCanvasBlockPreviewElement,
  findCanvasPreviewContainer,
  isEditableTarget,
  resolveCanvasGridCellFromPoint,
  showCanvasContextMenu,
  showCanvasDragBadge,
  showCanvasGridOverlay,
  showCanvasHoverLabel,
  showCanvasMarqueeRectangle,
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
  removeItems?: (path: string, toDelete: number[]) => () => void
}

interface UseCanvasPreviewClickToEditResult {
  // Rows in the block list report their hover here so the hovered block can
  // be highlighted on the live preview, Wix's layers-panel style; a no-op
  // for every non-canvas array control
  setHoveredListBlockIndex: (index: number | null) => void
}

interface CanvasBlockPlacement {
  colStart?: number
  colSpan?: number
  rowStart?: number
  rowSpan?: number
}

// In-memory clipboard for canvas blocks, module-level so copied blocks
// survive selection changes, editor reopens, and pastes into other canvases
// (every canvas shares the same child-block union). It holds one block from
// ⌘C on a selected block, or several in stacking order from ⌘C on a
// multi-selection. The OS clipboard is left alone: block JSON there would
// clobber the text users expect ⌘C to own.
let canvasBlockClipboard: unknown[] | null = null

export const resetCanvasBlockClipboard = (): void => {
  canvasBlockClipboard = null
}

const clipboardHasBlocks = (): boolean =>
  canvasBlockClipboard !== null && canvasBlockClipboard.length > 0

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

// A multi-selection member with a full grid placement, captured when the
// group is grabbed in the live preview: the drag moves every placed member by
// the same grid-cell delta
interface PlacedGroupMember {
  index: number
  colStart: number
  colSpan: number
  rowStart: number
  rowSpan: number
}

const collectPlacedGroupMembers = (
  blocks: unknown[],
  indices: number[],
): PlacedGroupMember[] =>
  indices.flatMap((index) => {
    const block = blocks[index] as
      | { placement?: CanvasBlockPlacement }
      | undefined
    const placement = block?.placement
    return placement?.colStart !== undefined &&
      placement.colSpan !== undefined &&
      placement.rowStart !== undefined
      ? [
          {
            index,
            colStart: placement.colStart,
            colSpan: placement.colSpan,
            rowStart: placement.rowStart,
            rowSpan: placement.rowSpan ?? 1,
          },
        ]
      : []
  })

const shiftBlockPlacements = (
  blocks: unknown[],
  moved: Set<number>,
  dCol: number,
  dRow: number,
): unknown[] =>
  blocks.map((block, index) => {
    if (!moved.has(index)) {
      return block
    }
    const { placement, ...rest } = block as {
      placement?: CanvasBlockPlacement
    }
    return {
      ...rest,
      placement: {
        ...placement,
        colStart: (placement?.colStart ?? 1) + dCol,
        rowStart: (placement?.rowStart ?? 1) + dRow,
      },
    }
  })

// Wix-style pointer group drag: pressing a member of the multi-selection
// grabs the whole group, and the drag moves every placed member by the grid
// cells the pointer has crossed since the grab. `moved` flips once the
// pointer leaves the grab cell — a press that never moves is a plain click.
interface GroupDragState {
  members: PlacedGroupMember[]
  grabbedIndex: number
  grab: CanvasGridCell
  current: CanvasGridCell
  moved: boolean
}

// The group moves as a unit: the pointer's raw delta is clamped so no member
// leaves the grid, so members' relative positions never distort — the group
// slides along an edge it has hit instead of crushing against it
const clampGroupDragDelta = (
  drag: GroupDragState,
): { dCol: number; dRow: number } => {
  const rawDCol = drag.current.col - drag.grab.col
  const rawDRow = drag.current.row - drag.grab.row
  const minDCol = Math.max(...drag.members.map((member) => 1 - member.colStart))
  const maxDCol = Math.min(
    ...drag.members.map(
      (member) => CANVAS_GRID_COLUMNS - (member.colStart + member.colSpan - 1),
    ),
  )
  const minDRow = Math.max(...drag.members.map((member) => 1 - member.rowStart))
  const maxDRow = Math.min(
    ...drag.members.map(
      (member) => CANVAS_MAX_ROW - (member.rowStart + member.rowSpan - 1),
    ),
  )
  return {
    dCol: Math.min(Math.max(rawDCol, minDCol), maxDCol),
    dRow: Math.min(Math.max(rawDRow, minDRow), maxDRow),
  }
}

// Wix-style rubber-band selection: a plain press on the empty canvas
// background sweeps out a viewport-space rectangle, and every block it
// touches on release becomes the multi-selection. `moved` flips once the
// pointer has travelled the threshold — anything less stays a plain click,
// keeping the deselect-on-background-click gesture intact. `additive`
// (Shift held at press) makes the swept blocks join the existing
// multi-selection instead of replacing it.
interface MarqueeDragState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  moved: boolean
  additive: boolean
}

const CANVAS_MARQUEE_DRAG_THRESHOLD_PX = 4

const restoreCustomProperty = (
  element: HTMLElement,
  name: string,
  value: string,
): void => {
  if (value) {
    element.style.setProperty(name, value)
  } else {
    element.style.removeProperty(name)
  }
}

// The canvas child-block union in schema order: a background right-click
// offers one "Add <block> here" command per entry, inserting that type's
// standard default block at the right-clicked grid cell. Kept in sync with
// the CanvasSchema blocks union by a regression test.
const CANVAS_ADDABLE_BLOCK_TYPES = [
  "image",
  "prose",
  "callout",
  "accordion",
  "blockquote",
  "contentpic",
  "infocols",
  "keystatistics",
  "imagegallery",
  "map",
  "video",
] as const

type CanvasAddableBlockType = (typeof CANVAS_ADDABLE_BLOCK_TYPES)[number]

// A newly added block starts at half the grid's width — wide enough to be
// usable, narrow enough to show blocks can sit side by side
const CANVAS_ADDED_BLOCK_COL_SPAN = CANVAS_GRID_COLUMNS / 2

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
// left/centre/right of the grid or stretching it across the full width;
// right-clicking the empty canvas background offers pasting or adding a new
// default block at the clicked grid cell. Shift+clicking blocks gathers them
// into a multi-selection for group actions: Delete removes them all at once,
// ⌘D duplicates them all at once (the selection moving to the copies), ⌘C/⌘X
// copy or cut the whole group to the block clipboard (⌘V pastes it back with
// the members' relative layout intact, the selection moving to the copies),
// the arrow keys move the group one grid cell (clamped as a unit at the grid
// edges), dragging any member moves the whole group by the grid cells the
// pointer crosses (committed on release in one data change, Escape
// cancelling the drag), Escape or a plain background click clears the set,
// and right-clicking a member opens a group context menu with the same
// actions plus Wix's group align commands, which line the placed members up
// against an edge (or the centre) of the group's own bounding box. Sweeping
// a plain press across the empty canvas background rubber-bands every block
// the marquee touches into the same multi-selection.
export const useCanvasPreviewClickToEdit = ({
  path,
  selectedIndex,
  setSelectedIndex,
  removeSelectedItem,
  addItem,
  moveUp,
  moveDown,
  removeItems,
}: UseCanvasPreviewClickToEditArgs): UseCanvasPreviewClickToEditResult => {
  const { core: jsonFormsCore, dispatch } = useJsonForms()
  const [hoverColor] = useToken("colors", ["interaction.main.default"])
  // Preview-viewport coordinates of an open right-click context menu: on a
  // block it offers the selection actions, on a member of the multi-selection
  // it offers the group actions, and on the empty canvas background it offers
  // Wix's "paste here" and "add here" commands targeting the right-clicked
  // grid cell
  const [contextMenu, setContextMenu] = useState<
    | { variant: "block"; clientX: number; clientY: number }
    | { variant: "multi"; clientX: number; clientY: number }
    | {
        variant: "background"
        clientX: number
        clientY: number
        cell: CanvasGridCell
      }
    | null
  >(null)
  // Index of the block whose row in the sidebar block list is being hovered,
  // reported by the array control's rows via setHoveredListBlockIndex
  const [hoveredListBlockIndex, setHoveredListBlockIndex] = useState<
    number | null
  >(null)
  // Wix-style multi-selection: Shift+clicking blocks in the live preview
  // gathers them here for group actions (Delete removes them all, Escape or
  // a plain background click clears the set). Mutually exclusive with the
  // single selection — opening a block's editor drops the multi-selection,
  // and seeding the set closes the editor.
  const [multiSelectedIndices, setMultiSelectedIndices] = useState<number[]>([])
  // Wix-style pointer group drag: a plain press on a member of the
  // multi-selection grabs the whole group, and releasing commits every
  // placed member's shifted placement in one data change
  const [groupDrag, setGroupDrag] = useState<GroupDragState | null>(null)
  // Wix-style rubber-band selection: a plain press on the empty canvas
  // background sweeps out a marquee, and every block it touches on release
  // becomes the multi-selection
  const [marquee, setMarquee] = useState<MarqueeDragState | null>(null)
  // The marquee rectangle is created once per sweep and repositioned per
  // pointer move through this ref, so it is not recreated on every move
  const marqueeRectangleRef = useRef<CanvasMarqueeRectangle | null>(null)
  // The click that trails a group drag or a marquee sweep must not act as a
  // plain click — it would open the released-over block's editor or clear
  // the multi-selection the gesture just produced
  const suppressPreviewClickRef = useRef(false)
  // The preview only re-renders when data commits, so during a group drag the
  // members are repositioned live via the same CSS custom properties the
  // Canvas renderer emits; the originals are captured here so a cancelled
  // drag can restore them (a committed drag keeps the final values — the
  // committed data re-renders the preview and owns them from then on)
  const groupDragCapturesRef = useRef<Map<
    number,
    { element: HTMLElement; column: string; row: string }
  > | null>(null)
  const releaseGroupDragFeedback = useCallback((restore: boolean) => {
    const captures = groupDragCapturesRef.current
    groupDragCapturesRef.current = null
    if (!captures || !restore) {
      return
    }
    captures.forEach(({ element, column, row }) => {
      restoreCustomProperty(element, "--canvas-grid-column", column)
      restoreCustomProperty(element, "--canvas-grid-row", row)
    })
  }, [])
  // Closing the editor (or unmounting) mid-drag restores the members
  useEffect(
    () => () => releaseGroupDragFeedback(true),
    [releaseGroupDragFeedback],
  )
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
  // into the module-level clipboard, cut also removes it, and paste appends
  // clones with their placements shifted one row down — re-snapshotting the
  // shifted clones so successive pastes cascade down the grid instead of
  // stacking on one spot. Pasting a single block switches the editor to it;
  // pasting a group (copied from a multi-selection) becomes the new
  // multi-selection so a follow-up group action acts on the copies.
  const copySelectedBlock = useCallback(() => {
    if (selectedIndex === undefined) {
      return false
    }
    const source: unknown = blocksRef.current[selectedIndex]
    if (source === undefined || source === null) {
      return false
    }
    canvasBlockClipboard = [structuredClone(source)]
    return true
  }, [selectedIndex])

  const cutSelectedBlock = useCallback(() => {
    if (selectedIndex !== undefined && copySelectedBlock()) {
      removeSelectedItem(path, selectedIndex)()
    }
  }, [copySelectedBlock, removeSelectedItem, path, selectedIndex])

  const appendBlockCopies = useCallback(
    (copies: unknown[]) => {
      const firstCopyIndex = blocksRef.current.length
      if (copies.length === 1) {
        addItem(path, copies[0])()
        setSelectedIndex(firstCopyIndex)
        return
      }
      if (!dispatch) {
        return
      }
      dispatch(update(path, (blocks: unknown[]) => [...blocks, ...copies]))
      setMultiSelectedIndices(
        copies.map((_, offset) => firstCopyIndex + offset),
      )
      if (selectedIndex !== undefined) {
        setSelectedIndex(undefined)
      }
    },
    [path, addItem, dispatch, selectedIndex, setSelectedIndex],
  )

  const pasteBlockFromClipboard = useCallback(() => {
    if (!clipboardHasBlocks()) {
      return
    }
    const copies = (canvasBlockClipboard ?? []).map((block) => {
      const copy = structuredClone(block) as {
        placement?: CanvasBlockPlacement
      }
      shiftPlacementOneRowDown(copy)
      return copy
    })
    canvasBlockClipboard = copies.map((copy) => structuredClone(copy))
    appendBlockCopies(copies)
  }, [appendBlockCopies])

  // Wix's "paste here": the clipboard blocks land with their group's
  // top-left corner on the grid cell that was right-clicked, keeping every
  // member's span and the members' relative layout (the whole group's shift
  // is clamped as a unit so every member stays on the grid); an unplaced
  // clipboard block stays full width and is pinned at the clicked row. The
  // clipboard re-snapshots the placed copies so a follow-up ⌘V cascades from
  // the pasted position.
  const pasteBlockHereFromClipboard = useCallback(
    (cell: CanvasGridCell) => {
      if (!clipboardHasBlocks()) {
        return
      }
      const copies = (canvasBlockClipboard ?? []).map(
        (block) =>
          structuredClone(block) as { placement?: CanvasBlockPlacement },
      )
      const placed = copies.flatMap((copy) => {
        const placement = copy.placement
        return placement?.colStart !== undefined &&
          placement.colSpan !== undefined &&
          placement.rowStart !== undefined
          ? [
              {
                copy,
                colStart: placement.colStart,
                colSpan: placement.colSpan,
                rowStart: placement.rowStart,
                rowSpan: placement.rowSpan ?? 1,
              },
            ]
          : []
      })
      if (placed.length > 0) {
        const minColStart = Math.min(...placed.map((entry) => entry.colStart))
        const minRowStart = Math.min(...placed.map((entry) => entry.rowStart))
        const dCol = Math.min(
          cell.col - minColStart,
          ...placed.map(
            (entry) =>
              CANVAS_GRID_COLUMNS - (entry.colStart + entry.colSpan - 1),
          ),
        )
        const dRow = Math.min(
          cell.row - minRowStart,
          ...placed.map(
            (entry) => CANVAS_MAX_ROW - (entry.rowStart + entry.rowSpan - 1),
          ),
        )
        placed.forEach((entry) => {
          entry.copy.placement = {
            ...entry.copy.placement,
            colStart: entry.colStart + dCol,
            rowStart: entry.rowStart + dRow,
          }
        })
      }
      const placedCopies = new Set(placed.map((entry) => entry.copy))
      copies.forEach((copy) => {
        if (placedCopies.has(copy)) {
          return
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
      })
      canvasBlockClipboard = copies.map((copy) => structuredClone(copy))
      appendBlockCopies(copies)
    },
    [appendBlockCopies],
  )

  // Wix's "add here": a background right-click can insert any canvas child
  // block type — the type's standard default block lands with its top-left
  // corner on the right-clicked grid cell at half the grid's width, clamped
  // so it stays on the grid, and the editor switches to the new block.
  const addBlockHere = useCallback(
    (type: CanvasAddableBlockType, cell: CanvasGridCell) => {
      const defaultBlock = DEFAULT_BLOCKS[type]
      if (defaultBlock === undefined) {
        return
      }
      const block = structuredClone(defaultBlock) as {
        placement?: CanvasBlockPlacement
      }
      block.placement = {
        colStart: Math.min(
          cell.col,
          CANVAS_GRID_COLUMNS - CANVAS_ADDED_BLOCK_COL_SPAN + 1,
        ),
        colSpan: CANVAS_ADDED_BLOCK_COL_SPAN,
        rowStart: Math.min(cell.row, CANVAS_MAX_ROW),
        rowSpan: 1,
      }
      addItem(path, block)()
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

  // Group actions shared by the multi-selection keyboard shortcuts and the
  // group context menu, so the two entry points cannot drift apart: duplicate
  // appends a copy of every member in ONE data change (copies in stacking
  // order regardless of the order the members were Shift+clicked in, placed
  // copies landing one row below their sources) and moves the selection to
  // the copies so a follow-up group action acts on them; remove deletes every
  // member in one data change.
  const duplicateMultiSelectedBlocks = useCallback(() => {
    if (!dispatch || multiSelectedIndices.length === 0) {
      return
    }
    const members = [...multiSelectedIndices].sort((a, b) => a - b)
    const copies = members.flatMap((index) => {
      const source: unknown = blocksRef.current[index]
      if (source === undefined || source === null) {
        return []
      }
      const copy = structuredClone(source) as {
        placement?: CanvasBlockPlacement
      }
      shiftPlacementOneRowDown(copy)
      return [copy]
    })
    if (copies.length === 0) {
      return
    }
    const firstCopyIndex = blocksRef.current.length
    dispatch(update(path, (blocks: unknown[]) => [...blocks, ...copies]))
    setMultiSelectedIndices(copies.map((_, offset) => firstCopyIndex + offset))
  }, [dispatch, multiSelectedIndices, path])

  const removeMultiSelectedBlocks = useCallback(() => {
    if (multiSelectedIndices.length === 0) {
      return
    }
    removeItems?.(path, [...multiSelectedIndices])()
    setMultiSelectedIndices([])
  }, [multiSelectedIndices, path, removeItems])

  // The group clipboard actions behind ⌘C/⌘X on the multi-selection: copy
  // snapshots every member into the block clipboard in stacking order
  // (regardless of the order the members were Shift+clicked in), so a paste
  // reproduces the group's layout; cut also removes the members in one data
  // change. Pasting a group goes through pasteBlockFromClipboard above.
  const copyMultiSelectedBlocks = useCallback(() => {
    if (multiSelectedIndices.length === 0) {
      return false
    }
    const snapshots = [...multiSelectedIndices]
      .sort((a, b) => a - b)
      .flatMap((index) => {
        const source: unknown = blocksRef.current[index]
        return source === undefined || source === null
          ? []
          : [structuredClone(source)]
      })
    if (snapshots.length === 0) {
      return false
    }
    canvasBlockClipboard = snapshots
    return true
  }, [multiSelectedIndices])

  const cutMultiSelectedBlocks = useCallback(() => {
    if (copyMultiSelectedBlocks()) {
      removeMultiSelectedBlocks()
    }
  }, [copyMultiSelectedBlocks, removeMultiSelectedBlocks])

  // Wix's group align commands: line up every placed member of the
  // multi-selection against an edge (or the centre) of the group's own
  // bounding box, in ONE data change. Spans are untouched, unplaced members
  // are skipped, and it takes at least two placed members to have a box to
  // align within — with fewer, or when every member already sits on the
  // target edge, nothing commits so the command can never spuriously dirty
  // the page. Targets stay on the grid without clamping because the bounding
  // box is itself made of on-grid placements.
  const alignMultiSelectedBlocks = useCallback(
    (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (!dispatch) {
        return
      }
      const members = collectPlacedGroupMembers(
        blocksRef.current,
        multiSelectedIndices,
      )
      if (members.length < 2) {
        return
      }
      const boxColStart = Math.min(...members.map((member) => member.colStart))
      const boxColEnd = Math.max(
        ...members.map((member) => member.colStart + member.colSpan - 1),
      )
      const boxRowStart = Math.min(...members.map((member) => member.rowStart))
      const boxRowEnd = Math.max(
        ...members.map((member) => member.rowStart + member.rowSpan - 1),
      )
      const targets = new Map<number, Partial<CanvasBlockPlacement>>()
      for (const member of members) {
        const target: Partial<CanvasBlockPlacement> =
          alignment === "left"
            ? { colStart: boxColStart }
            : alignment === "right"
              ? { colStart: boxColEnd - member.colSpan + 1 }
              : alignment === "center"
                ? {
                    colStart:
                      boxColStart +
                      Math.floor(
                        (boxColEnd - boxColStart + 1 - member.colSpan) / 2,
                      ),
                  }
                : alignment === "top"
                  ? { rowStart: boxRowStart }
                  : alignment === "bottom"
                    ? { rowStart: boxRowEnd - member.rowSpan + 1 }
                    : {
                        rowStart:
                          boxRowStart +
                          Math.floor(
                            (boxRowEnd - boxRowStart + 1 - member.rowSpan) / 2,
                          ),
                      }
        const changed =
          (target.colStart !== undefined &&
            target.colStart !== member.colStart) ||
          (target.rowStart !== undefined && target.rowStart !== member.rowStart)
        if (changed) {
          targets.set(member.index, target)
        }
      }
      if (targets.size === 0) {
        return
      }
      dispatch(
        update(path, (blocks: unknown[]) =>
          blocks.map((block, index) => {
            const target = targets.get(index)
            if (!target) {
              return block
            }
            const { placement, ...rest } = block as {
              placement?: CanvasBlockPlacement
            }
            return { ...rest, placement: { ...placement, ...target } }
          }),
        ),
      )
    },
    [dispatch, multiSelectedIndices, path],
  )

  // Wix's distribute-spacing commands: equalize the gaps between consecutive
  // placed members of the multi-selection along one axis, keeping the
  // outermost members' edges (the group's bounding box) fixed, in ONE data
  // change. Spans are untouched and unplaced members are skipped. It takes at
  // least three placed members to have a middle block to space out — with
  // fewer, or when the gaps are already equal, nothing commits. A fractional
  // ideal gap is rounded per position, so the last member still lands exactly
  // on the box's far edge and every target stays inside the on-grid box.
  const distributeMultiSelectedBlocks = useCallback(
    (axis: "horizontal" | "vertical") => {
      if (!dispatch) {
        return
      }
      const members = collectPlacedGroupMembers(
        blocksRef.current,
        multiSelectedIndices,
      )
      if (members.length < 3) {
        return
      }
      const startOf = (member: PlacedGroupMember) =>
        axis === "horizontal" ? member.colStart : member.rowStart
      const spanOf = (member: PlacedGroupMember) =>
        axis === "horizontal" ? member.colSpan : member.rowSpan
      const sorted = [...members].sort((a, b) => startOf(a) - startOf(b))
      const boxStart = Math.min(...sorted.map(startOf))
      const boxEnd = Math.max(
        ...sorted.map((member) => startOf(member) + spanOf(member) - 1),
      )
      const totalSpan = sorted.reduce((sum, member) => sum + spanOf(member), 0)
      const gap = (boxEnd - boxStart + 1 - totalSpan) / (sorted.length - 1)
      const targets = new Map<number, Partial<CanvasBlockPlacement>>()
      let precedingSpans = 0
      sorted.forEach((member, position) => {
        const start = boxStart + precedingSpans + Math.round(position * gap)
        precedingSpans += spanOf(member)
        if (start !== startOf(member)) {
          targets.set(
            member.index,
            axis === "horizontal" ? { colStart: start } : { rowStart: start },
          )
        }
      })
      if (targets.size === 0) {
        return
      }
      dispatch(
        update(path, (blocks: unknown[]) =>
          blocks.map((block, index) => {
            const target = targets.get(index)
            if (!target) {
              return block
            }
            const { placement, ...rest } = block as {
              placement?: CanvasBlockPlacement
            }
            return { ...rest, placement: { ...placement, ...target } }
          }),
        ),
      )
    },
    [dispatch, multiSelectedIndices, path],
  )

  const clearMultiSelection = useCallback(() => {
    setMultiSelectedIndices([])
  }, [])

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
        block &&
        Number.isInteger(index) &&
        index !== selectedIndex &&
        !multiSelectedIndices.includes(index)
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
      if (event.button !== 0 || !event.altKey || event.shiftKey) {
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
        // A press on the canvas background sweeps out a rubber-band
        // marquee: every block it touches on release becomes the
        // multi-selection, Wix-style. Holding Shift makes the sweep
        // additive — the swept blocks join the existing selection instead
        // of replacing it — and a press that never travels stays a plain
        // click.
        event.preventDefault()
        setMarquee({
          startX: event.clientX,
          startY: event.clientY,
          currentX: event.clientX,
          currentY: event.clientY,
          moved: false,
          additive: event.shiftKey,
        })
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
      // Shift+press toggles the block in the multi-selection instead of
      // selecting it, Wix-style; with a block's editor open, that block
      // seeds the set and the editor closes so both blocks show as selected
      if (event.shiftKey) {
        setMultiSelectedIndices((previous) => {
          const seeded =
            previous.length === 0 && selectedIndex !== undefined
              ? [selectedIndex]
              : previous
          return seeded.includes(index)
            ? seeded.filter((member) => member !== index)
            : [...seeded, index]
        })
        if (selectedIndex !== undefined) {
          setSelectedIndex(undefined)
        }
        return
      }
      // A plain press on a member of the multi-selection grabs the whole
      // group, Wix-style: the drag moves every placed member by the same
      // grid-cell delta, committed on release, and the set survives the drag
      if (multiSelectedIndices.includes(index)) {
        const cell = resolveCanvasGridCellFromPoint(
          canvas,
          event.clientX,
          event.clientY,
        )
        const members = collectPlacedGroupMembers(
          blocksRef.current,
          multiSelectedIndices,
        )
        if (!cell || members.length === 0) {
          return
        }
        setGroupDrag({
          members,
          grabbedIndex: index,
          grab: cell,
          current: cell,
          moved: false,
        })
        return
      }
      setMultiSelectedIndices((previous) =>
        previous.length === 0 ? previous : [],
      )
      setCanvasPreviewGrabHandoff(
        { blockIndex: index, clientX: event.clientX, clientY: event.clientY },
        canvas.ownerDocument.defaultView ?? window,
      )
      setSelectedIndex(index)
    }

    const openBlockEditor = (event: MouseEvent) => {
      // The click that trails a group drag or a marquee sweep must not act
      // as a plain click — it would open the dragged block's editor or
      // clear the selection the sweep just produced; a press-and-release
      // that never moved is a plain click
      const suppressClick = suppressPreviewClickRef.current
      suppressPreviewClickRef.current = false
      const block = resolveBlock(event)
      if (!block) {
        if (deselectArmed && !event.shiftKey && !suppressClick) {
          if (selectedIndex !== undefined) {
            setSelectedIndex(undefined)
          }
          setMultiSelectedIndices((previous) =>
            previous.length === 0 ? previous : [],
          )
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
      // A Shift+click's mousedown already toggled the multi-selection
      if (event.shiftKey || suppressClick) {
        return
      }
      if (index !== selectedIndex) {
        setSelectedIndex(index)
      }
    }

    // Right-clicking a block selects it and opens the context menu at the
    // pointer, Wix-style. Right-clicking the empty canvas background offers
    // "paste here" and "add here" commands targeting the right-clicked grid
    // cell; the browser's native menu is kept only when the canvas cannot be
    // measured (no cell to target).
    const openContextMenu = (event: MouseEvent) => {
      const block = resolveBlock(event)
      if (!block) {
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
      // Right-clicking a member of the multi-selection keeps the set intact
      // and opens the group menu; a non-member right-click selects that
      // block (which drops the multi-selection) and opens the block menu
      if (multiSelectedIndices.includes(index)) {
        setContextMenu({
          variant: "multi",
          clientX: event.clientX,
          clientY: event.clientY,
        })
        return
      }
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
    multiSelectedIndices,
    path,
    selectedIndex,
    setSelectedIndex,
  ])

  // Wix's layers-panel hover sync, the reverse of the preview hover above:
  // hovering a block's row in the sidebar block list outlines that block on
  // the live preview with the same dashed outline and name chip, so rows can
  // be matched to blocks before opening one. Rows only render in list view,
  // and a row click both selects and unmounts the list — its mouseleave never
  // fires — so stale hover state is dropped once a block is selected.
  useEffect(() => {
    if (
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH ||
      hoveredListBlockIndex === null ||
      // A multi-selected block already shows its solid highlight
      multiSelectedIndices.includes(hoveredListBlockIndex)
    ) {
      return
    }
    if (selectedIndex !== undefined) {
      setHoveredListBlockIndex(null)
      return
    }
    const block = findCanvasBlockPreviewElement(
      document,
      canvasOrdinal,
      hoveredListBlockIndex,
    )
    if (!block) {
      return
    }
    const previousOutline = block.style.outline
    const previousOutlineOffset = block.style.outlineOffset
    block.style.outline = `2px dashed ${hoverColor}`
    block.style.outlineOffset = "2px"
    const canvasPageBlock =
      content !== undefined && currActiveIdx !== undefined
        ? content[currActiveIdx]
        : undefined
    const child =
      canvasPageBlock?.type === "canvas"
        ? canvasPageBlock.blocks[hoveredListBlockIndex]
        : undefined
    const removeLabel = child
      ? showCanvasHoverLabel(block, BLOCK_TO_META[child.type].label, hoverColor)
      : null
    return () => {
      block.style.outline = previousOutline
      block.style.outlineOffset = previousOutlineOffset
      removeLabel?.()
    }
  }, [
    canvasOrdinal,
    content,
    currActiveIdx,
    hoverColor,
    hoveredListBlockIndex,
    multiSelectedIndices,
    path,
    selectedIndex,
  ])

  // Solid highlight on every multi-selected block in the live preview.
  // Opening a block's editor (e.g. by clicking its row in the block list,
  // which bypasses the preview handlers) drops the multi-selection — the two
  // selection modes are mutually exclusive.
  useEffect(() => {
    if (
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH ||
      multiSelectedIndices.length === 0
    ) {
      return
    }
    if (selectedIndex !== undefined) {
      setMultiSelectedIndices([])
      return
    }
    const restores = multiSelectedIndices.flatMap((index) => {
      const block = findCanvasBlockPreviewElement(
        document,
        canvasOrdinal,
        index,
      )
      if (!block) {
        return []
      }
      const previousOutline = block.style.outline
      const previousOutlineOffset = block.style.outlineOffset
      block.style.outline = `2px solid ${hoverColor}`
      block.style.outlineOffset = "2px"
      return [
        () => {
          block.style.outline = previousOutline
          block.style.outlineOffset = previousOutlineOffset
        },
      ]
    })
    return () => restores.forEach((restore) => restore())
  }, [canvasOrdinal, hoverColor, multiSelectedIndices, path, selectedIndex])

  // The pointer group drag's tracking and commit: the pointer is tracked on
  // the preview window (mapped to grid cells through the rendered canvas's
  // geometry), releasing anywhere commits the clamped delta in ONE data
  // change (a release on the grab cell commits nothing), and Escape cancels
  // the drag — capture phase so the group-shortcut Escape (clear selection)
  // and the drawer's own close handlers never see it.
  useEffect(() => {
    if (groupDrag === null) {
      return
    }
    const canvas =
      canvasOrdinal !== null && path === CANVAS_BLOCKS_PATH
        ? findCanvasPreviewContainer(document, canvasOrdinal)
        : null
    if (!canvas) {
      setGroupDrag(null)
      return
    }
    const endDrag = (commit: boolean) => {
      if (groupDrag.moved) {
        suppressPreviewClickRef.current = true
      }
      const { dCol, dRow } = clampGroupDragDelta(groupDrag)
      if (commit && (dCol !== 0 || dRow !== 0) && dispatch) {
        // The committed data re-renders the preview and owns the members'
        // positions from then on
        releaseGroupDragFeedback(false)
        const moved = new Set(groupDrag.members.map((member) => member.index))
        dispatch(
          update(path, (blocks: unknown[]) =>
            shiftBlockPlacements(blocks, moved, dCol, dRow),
          ),
        )
      } else {
        releaseGroupDragFeedback(true)
      }
      setGroupDrag(null)
    }
    const commitGroupDrag = () => endDrag(true)
    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      endDrag(false)
    }
    const trackPointer = (event: MouseEvent) => {
      const cell = resolveCanvasGridCellFromPoint(
        canvas,
        event.clientX,
        event.clientY,
      )
      if (!cell) {
        return
      }
      setGroupDrag((current) =>
        current &&
        (current.current.row !== cell.row || current.current.col !== cell.col)
          ? {
              ...current,
              current: cell,
              moved:
                current.moved ||
                cell.row !== current.grab.row ||
                cell.col !== current.grab.col,
            }
          : current,
      )
    }
    // addEventListener dedupes, so double registration is safe when the
    // preview shares the editor window
    const previewWindow = canvas.ownerDocument.defaultView
    window.addEventListener("mouseup", commitGroupDrag)
    window.addEventListener("keydown", cancelOnEscape, true)
    previewWindow?.addEventListener("mousemove", trackPointer)
    previewWindow?.addEventListener("mouseup", commitGroupDrag)
    previewWindow?.addEventListener("keydown", cancelOnEscape, true)
    return () => {
      window.removeEventListener("mouseup", commitGroupDrag)
      window.removeEventListener("keydown", cancelOnEscape, true)
      previewWindow?.removeEventListener("mousemove", trackPointer)
      previewWindow?.removeEventListener("mouseup", commitGroupDrag)
      previewWindow?.removeEventListener("keydown", cancelOnEscape, true)
    }
  }, [groupDrag, canvasOrdinal, path, dispatch, releaseGroupDragFeedback])

  // The grid overlay while a group drag is in progress — keyed on the moved
  // flag (not the pointer cell) so it draws once per drag, and only once the
  // pointer has actually crossed cells: a plain click never flashes the grid
  const groupDragActive = groupDrag !== null && groupDrag.moved
  useEffect(() => {
    if (
      !groupDragActive ||
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH
    ) {
      return
    }
    const canvas = findCanvasPreviewContainer(document, canvasOrdinal)
    if (!canvas) {
      return
    }
    return showCanvasGridOverlay(canvas, hoverColor)
  }, [groupDragActive, canvasOrdinal, path, hoverColor])

  // Live feedback while the group drag is in progress: every placed member is
  // repositioned by the clamped delta via the Canvas renderer's CSS custom
  // properties (originals captured once per drag for restore-on-cancel), and
  // a badge above the grabbed member names the grid area it will occupy on
  // release, matching the single-block drag's affordance
  useEffect(() => {
    if (
      groupDrag === null ||
      !groupDrag.moved ||
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH
    ) {
      return
    }
    const { dCol, dRow } = clampGroupDragDelta(groupDrag)
    const captures = (groupDragCapturesRef.current ??= new Map())
    groupDrag.members.forEach((member) => {
      const element = findCanvasBlockPreviewElement(
        document,
        canvasOrdinal,
        member.index,
      )
      if (!element) {
        return
      }
      if (!captures.has(member.index)) {
        captures.set(member.index, {
          element,
          column: element.style.getPropertyValue("--canvas-grid-column"),
          row: element.style.getPropertyValue("--canvas-grid-row"),
        })
      }
      element.style.setProperty(
        "--canvas-grid-column",
        `${member.colStart + dCol} / span ${member.colSpan}`,
      )
      element.style.setProperty(
        "--canvas-grid-row",
        `${member.rowStart + dRow} / span ${member.rowSpan}`,
      )
    })
    const grabbed = groupDrag.members.find(
      (member) => member.index === groupDrag.grabbedIndex,
    )
    const grabbedElement = grabbed
      ? findCanvasBlockPreviewElement(document, canvasOrdinal, grabbed.index)
      : null
    if (!grabbed || !grabbedElement) {
      return
    }
    return showCanvasDragBadge(
      grabbedElement,
      `Columns ${grabbed.colStart + dCol}–${grabbed.colStart + grabbed.colSpan - 1 + dCol}, rows ${grabbed.rowStart + dRow}–${grabbed.rowStart + grabbed.rowSpan - 1 + dRow}`,
      hoverColor,
    )
  }, [groupDrag, canvasOrdinal, path, hoverColor])

  // The rubber-band marquee's tracking and commit: the pointer is tracked on
  // the preview window in viewport coordinates, releasing turns every block
  // whose rendered rect the rectangle touches into the multi-selection (a
  // plain sweep over empty canvas deselects, like a plain background click;
  // a Shift-held sweep adds to the existing selection instead), and
  // Escape cancels the sweep — capture phase so the group-shortcut Escape
  // (clear selection) and the drawer's own close handlers never see it. A
  // click while the marquee is somehow still active means its mouseup was
  // missed, so the click doubles as the release.
  useEffect(() => {
    if (marquee === null) {
      return
    }
    const canvas =
      canvasOrdinal !== null && path === CANVAS_BLOCKS_PATH
        ? findCanvasPreviewContainer(document, canvasOrdinal)
        : null
    if (!canvas) {
      setMarquee(null)
      return
    }
    const endMarquee = (commit: boolean) => {
      if (marquee.moved) {
        // The trailing click must not clear the selection the sweep just
        // produced
        suppressPreviewClickRef.current = true
      }
      if (commit && marquee.moved) {
        const left = Math.min(marquee.startX, marquee.currentX)
        const right = Math.max(marquee.startX, marquee.currentX)
        const top = Math.min(marquee.startY, marquee.currentY)
        const bottom = Math.max(marquee.startY, marquee.currentY)
        const indices = Array.from(
          canvas.querySelectorAll<HTMLElement>(
            `[${CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE}]`,
          ),
        ).flatMap((element) => {
          const index = Number(
            element.getAttribute(CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE),
          )
          if (!Number.isInteger(index) || index < 0) {
            return []
          }
          // The marquee selects what it visibly touches; a zero-size rect
          // cannot be swept
          const rect = element.getBoundingClientRect()
          const touched =
            rect.width > 0 &&
            rect.height > 0 &&
            rect.left <= right &&
            rect.right >= left &&
            rect.top <= bottom &&
            rect.bottom >= top
          return touched ? [index] : []
        })
        if (marquee.additive) {
          // A Shift-held sweep adds what it touched to the existing
          // selection; with a block's editor open, that block seeds the
          // set, same as the Shift+click toggle. Sweeping nothing keeps
          // the selection (only a plain sweep over nothing deselects).
          if (indices.length > 0) {
            setMultiSelectedIndices((previous) => {
              const seeded =
                previous.length === 0 && selectedIndex !== undefined
                  ? [selectedIndex]
                  : previous
              const added = indices.filter((index) => !seeded.includes(index))
              return added.length === 0 && seeded === previous
                ? previous
                : [...seeded, ...added]
            })
            if (selectedIndex !== undefined) {
              setSelectedIndex(undefined)
            }
          }
        } else if (indices.length > 0) {
          setMultiSelectedIndices(indices)
          if (selectedIndex !== undefined) {
            setSelectedIndex(undefined)
          }
        } else {
          setMultiSelectedIndices((previous) =>
            previous.length === 0 ? previous : [],
          )
        }
      }
      setMarquee(null)
    }
    const commitMarquee = () => endMarquee(true)
    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      endMarquee(false)
    }
    const trackPointer = (event: MouseEvent) => {
      setMarquee((current) =>
        current &&
        (current.currentX !== event.clientX ||
          current.currentY !== event.clientY)
          ? {
              ...current,
              currentX: event.clientX,
              currentY: event.clientY,
              moved:
                current.moved ||
                Math.abs(event.clientX - current.startX) >=
                  CANVAS_MARQUEE_DRAG_THRESHOLD_PX ||
                Math.abs(event.clientY - current.startY) >=
                  CANVAS_MARQUEE_DRAG_THRESHOLD_PX,
            }
          : current,
      )
    }
    // addEventListener dedupes, so double registration is safe when the
    // preview shares the editor window
    const previewWindow = canvas.ownerDocument.defaultView
    window.addEventListener("mouseup", commitMarquee)
    window.addEventListener("click", commitMarquee)
    window.addEventListener("keydown", cancelOnEscape, true)
    previewWindow?.addEventListener("mousemove", trackPointer)
    previewWindow?.addEventListener("mouseup", commitMarquee)
    previewWindow?.addEventListener("click", commitMarquee)
    previewWindow?.addEventListener("keydown", cancelOnEscape, true)
    return () => {
      window.removeEventListener("mouseup", commitMarquee)
      window.removeEventListener("click", commitMarquee)
      window.removeEventListener("keydown", cancelOnEscape, true)
      previewWindow?.removeEventListener("mousemove", trackPointer)
      previewWindow?.removeEventListener("mouseup", commitMarquee)
      previewWindow?.removeEventListener("click", commitMarquee)
      previewWindow?.removeEventListener("keydown", cancelOnEscape, true)
    }
  }, [marquee, canvasOrdinal, path, selectedIndex, setSelectedIndex])

  // The marquee rectangle draws once the press has actually travelled (a
  // plain background click never flashes it) and is torn down when the sweep
  // ends; the effect below repositions it per pointer move, so the rectangle
  // is not recreated on every move
  const marqueeVisible = marquee !== null && marquee.moved
  useEffect(() => {
    if (
      !marqueeVisible ||
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH
    ) {
      return
    }
    const canvas = findCanvasPreviewContainer(document, canvasOrdinal)
    if (!canvas) {
      return
    }
    const rectangle = showCanvasMarqueeRectangle(
      canvas.ownerDocument,
      hoverColor,
    )
    marqueeRectangleRef.current = rectangle
    return () => {
      marqueeRectangleRef.current = null
      rectangle.cleanup()
    }
  }, [marqueeVisible, canvasOrdinal, path, hoverColor])

  useEffect(() => {
    if (marquee === null || !marquee.moved) {
      return
    }
    marqueeRectangleRef.current?.update({
      left: Math.min(marquee.startX, marquee.currentX),
      top: Math.min(marquee.startY, marquee.currentY),
      width: Math.abs(marquee.currentX - marquee.startX),
      height: Math.abs(marquee.currentY - marquee.startY),
    })
  }, [marquee])

  // Group actions on the multi-selection: Delete/Backspace removes every
  // multi-selected block in one data change, ⌘D/Ctrl+D appends a copy of
  // every member in one data change (placed copies land one row below their
  // sources, and the selection moves to the copies), ⌘C/⌘X copy or cut the
  // group to the block clipboard (⌘V, handled by the always-active clipboard
  // effect below, pastes it back), the arrow keys nudge every placed member
  // one grid cell (the group moves as a unit — if any member would leave the
  // grid, nothing moves, so members' relative positions never distort), and
  // Escape clears the selection.
  // Registered on both windows, like the single-selection shortcuts below.
  useEffect(() => {
    if (
      canvasOrdinal === null ||
      path !== CANVAS_BLOCKS_PATH ||
      multiSelectedIndices.length === 0 ||
      selectedIndex !== undefined
    ) {
      return
    }
    const nudgeGroup = (dCol: number, dRow: number) => {
      if (!dispatch) {
        return
      }
      // Only placed members move; an unplaced block has no grid position to
      // shift and stays in the stacked flow
      const placedMembers = collectPlacedGroupMembers(
        blocksRef.current,
        multiSelectedIndices,
      )
      const blocked = placedMembers.some(
        (member) =>
          member.colStart + dCol < 1 ||
          member.colStart + member.colSpan - 1 + dCol > CANVAS_GRID_COLUMNS ||
          member.rowStart + dRow < 1 ||
          member.rowStart + member.rowSpan - 1 + dRow > CANVAS_MAX_ROW,
      )
      if (placedMembers.length === 0 || blocked) {
        return
      }
      const moved = new Set(placedMembers.map((member) => member.index))
      dispatch(
        update(path, (blocks: unknown[]) =>
          shiftBlockPlacements(blocks, moved, dCol, dRow),
        ),
      )
    }
    const handleGroupShortcut = (event: KeyboardEvent) => {
      // While a pointer group drag is in progress the drag owns the keys:
      // Escape cancels the drag (its own capture listener), and the group
      // shortcuts must not fire mid-drag
      if (
        groupDrag !== null ||
        event.defaultPrevented ||
        isEditableTarget(event.target)
      ) {
        return
      }
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        const combo = event.key.toLowerCase()
        if (combo === "d") {
          // Take over the keystroke even from the browser's bookmark shortcut
          event.preventDefault()
          duplicateMultiSelectedBlocks()
          return
        }
        if (combo === "c" || combo === "x") {
          // A live text selection keeps its native copy meaning
          if (hasTextSelection(event.target)) {
            return
          }
          event.preventDefault()
          if (combo === "c") {
            copyMultiSelectedBlocks()
          } else {
            cutMultiSelectedBlocks()
          }
          return
        }
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        removeMultiSelectedBlocks()
      } else if (event.key === "Escape") {
        // While the group context menu is open, Escape means "close the
        // menu" (its own capture listener handles that), keeping the
        // selection; the DOM marker is the order-independent guard for
        // keydowns dispatched directly on either window
        const previewDocument = findCanvasPreviewContainer(
          document,
          canvasOrdinal,
        )?.ownerDocument
        if (
          previewDocument?.querySelector(
            `[${CANVAS_CONTEXT_MENU_DATA_ATTRIBUTE}]`,
          )
        ) {
          return
        }
        event.preventDefault()
        setMultiSelectedIndices([])
      } else if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        // Take over the keystroke even when the move clamps: while a
        // multi-selection is active, the arrows must never scroll the page
        event.preventDefault()
        nudgeGroup(
          event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0,
          event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0,
        )
      }
    }
    window.addEventListener("keydown", handleGroupShortcut)
    const previewWindow =
      findCanvasPreviewContainer(document, canvasOrdinal)?.ownerDocument
        .defaultView ?? null
    const foreignPreviewWindow = previewWindow === window ? null : previewWindow
    foreignPreviewWindow?.addEventListener("keydown", handleGroupShortcut)
    return () => {
      window.removeEventListener("keydown", handleGroupShortcut)
      foreignPreviewWindow?.removeEventListener("keydown", handleGroupShortcut)
    }
  }, [
    canvasOrdinal,
    copyMultiSelectedBlocks,
    cutMultiSelectedBlocks,
    dispatch,
    duplicateMultiSelectedBlocks,
    groupDrag,
    multiSelectedIndices,
    path,
    removeMultiSelectedBlocks,
    selectedIndex,
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
      // reaches both listeners, so the drag badge is the reliable
      // in-progress marker (the grid-guide overlay also shows while the
      // gridlines toggle is on, drag or not). Likewise, while the context
      // menu is open Escape means "close the menu" (its own listener
      // handles that), keeping the block selected.
      const previewCanvas = findCanvasPreviewContainer(document, canvasOrdinal)
      if (
        previewCanvas?.querySelector(`[${CANVAS_DRAG_BADGE_DATA_ATTRIBUTE}]`) ??
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
        if (!clipboardHasBlocks()) {
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
  // actions as the toolbar and the keyboard shortcuts; on a member of the
  // multi-selection, the group actions behind the group shortcuts; on the
  // empty canvas background, "paste here" and one "add here" command per
  // canvas child block type, both targeting the right-clicked grid cell. Opened
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
          disabled: !clipboardHasBlocks(),
          onClick: withClose(() => pasteBlockHereFromClipboard(cell)),
        },
        ...CANVAS_ADDABLE_BLOCK_TYPES.map(
          (type): CanvasSelectionToolbarAction => ({
            name: `add-${type}`,
            label: `Add ${BLOCK_TO_META[type].label.toLowerCase()} here`,
            glyph: "+",
            onClick: withClose(() => addBlockHere(type, cell)),
          }),
        ),
      ]
    } else if (contextMenu.variant === "multi") {
      if (multiSelectedIndices.length === 0) {
        // The multi-selection went away underneath an open menu — drop the
        // stale menu state
        setContextMenu(null)
        return
      }
      // The group align commands need at least two placed members to have a
      // bounding box to align within; distribute needs a third, middle member
      // to space out
      const placedGroupMemberCount = collectPlacedGroupMembers(
        blocksRef.current,
        multiSelectedIndices,
      ).length
      const canAlignGroup = placedGroupMemberCount >= 2
      const canDistributeGroup = placedGroupMemberCount >= 3
      items = [
        {
          name: "duplicate-group",
          label: "Duplicate blocks (⌘D)",
          glyph: "⧉",
          onClick: withClose(duplicateMultiSelectedBlocks),
        },
        {
          name: "copy-group",
          label: "Copy blocks (⌘C)",
          glyph: "⿻",
          onClick: withClose(() => {
            copyMultiSelectedBlocks()
          }),
        },
        {
          name: "cut-group",
          label: "Cut blocks (⌘X)",
          glyph: "✂",
          onClick: withClose(cutMultiSelectedBlocks),
        },
        {
          name: "paste-group",
          label: "Paste blocks (⌘V)",
          glyph: "⇲",
          disabled: !clipboardHasBlocks(),
          onClick: withClose(pasteBlockFromClipboard),
        },
        {
          name: "align-group-left",
          label: "Align left",
          glyph: "⇤",
          disabled: !canAlignGroup,
          onClick: withClose(() => alignMultiSelectedBlocks("left")),
        },
        {
          name: "align-group-center",
          label: "Align center",
          glyph: "↔",
          disabled: !canAlignGroup,
          onClick: withClose(() => alignMultiSelectedBlocks("center")),
        },
        {
          name: "align-group-right",
          label: "Align right",
          glyph: "⇥",
          disabled: !canAlignGroup,
          onClick: withClose(() => alignMultiSelectedBlocks("right")),
        },
        {
          name: "align-group-top",
          label: "Align top",
          glyph: "⤒",
          disabled: !canAlignGroup,
          onClick: withClose(() => alignMultiSelectedBlocks("top")),
        },
        {
          name: "align-group-middle",
          label: "Align middle",
          glyph: "↕",
          disabled: !canAlignGroup,
          onClick: withClose(() => alignMultiSelectedBlocks("middle")),
        },
        {
          name: "align-group-bottom",
          label: "Align bottom",
          glyph: "⤓",
          disabled: !canAlignGroup,
          onClick: withClose(() => alignMultiSelectedBlocks("bottom")),
        },
        {
          name: "distribute-group-horizontal",
          label: "Distribute horizontally",
          glyph: "⇹",
          disabled: !canDistributeGroup,
          onClick: withClose(() => distributeMultiSelectedBlocks("horizontal")),
        },
        {
          name: "distribute-group-vertical",
          label: "Distribute vertically",
          glyph: "⇅",
          disabled: !canDistributeGroup,
          onClick: withClose(() => distributeMultiSelectedBlocks("vertical")),
        },
        {
          name: "delete-group",
          label: "Delete blocks (Delete)",
          glyph: "✕",
          onClick: withClose(removeMultiSelectedBlocks),
        },
        {
          name: "clear-selection",
          label: "Clear selection (Escape)",
          glyph: "⊘",
          onClick: withClose(clearMultiSelection),
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
          disabled: !clipboardHasBlocks(),
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
    multiSelectedIndices,
    duplicateMultiSelectedBlocks,
    copyMultiSelectedBlocks,
    cutMultiSelectedBlocks,
    alignMultiSelectedBlocks,
    distributeMultiSelectedBlocks,
    removeMultiSelectedBlocks,
    clearMultiSelection,
    duplicateSelectedBlock,
    copySelectedBlock,
    cutSelectedBlock,
    pasteBlockFromClipboard,
    pasteBlockHereFromClipboard,
    addBlockHere,
    bringSelectedForward,
    sendSelectedBackward,
    bringSelectedToFront,
    sendSelectedToBack,
    alignSelectedBlock,
    removeSelectedBlock,
  ])

  return { setHoveredListBlockIndex }
}
