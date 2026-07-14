import type { Editor } from "@tiptap/react"
import type { ReactElement, ReactNode } from "react"
import { Divider, Flex, Text, VStack } from "@chakra-ui/react"
import { Button, Switch } from "@opengovsg/design-system-react"
import { PluginKey } from "@tiptap/pm/state"
import {
  CellSelection,
  moveTableColumn,
  moveTableRow,
  selectedRect,
  TableMap,
  tableEditingKey,
} from "@tiptap/pm/tables"
import { useEditorState } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { memo, useEffect } from "react"
import {
  BiDownArrowAlt,
  BiLeftArrowAlt,
  BiRightArrowAlt,
  BiTrash,
  BiUpArrowAlt,
} from "react-icons/bi"
import {
  IconAddColLeft,
  IconAddColRight,
  IconAddRowAbove,
  IconAddRowBelow,
  IconDelCol,
  IconDelRow,
  IconMergeCells,
  IconSplitCell,
} from "~/components/icons"

import {
  getColumnMovePlan,
  getRowMovePlan,
  getTableSelectionKind,
  selectionIncludesHeaderColumn,
  selectionIncludesHeaderRow,
  type SelectionKind,
} from "./TableBubbleMenu.utils"

export interface TableBubbleMenuProps {
  editor: Editor
}

// A single selected cell that came from a previous merge (colspan/rowspan >
// 1) is the only single-cell case that shows a bubble menu — "Split cell" is
// its sole way back. Ordinary single cells stay menu-less.
//
// NOTE: this can't be driven off `selectedRect`'s width/height — those are in
// TableMap grid units, which count a colspan-2 cell as spanning 2 columns
// even though only one cell NODE is selected. "Exactly one cell selected" is
// instead "anchor and head resolve to the same cell", which holds regardless
// of that cell's own colspan/rowspan.
const isSingleCellSelection = (selection: CellSelection): boolean =>
  selection.$anchorCell.pos === selection.$headCell.pos

const isMergedCell = (rect: ReturnType<typeof selectedRect>): boolean => {
  const cellStart = rect.map.map[rect.top * rect.map.width + rect.left]
  if (cellStart === undefined) return false
  const node = rect.table.nodeAt(cellStart)
  if (!node) return false
  return (
    (node.attrs.colspan as number) > 1 || (node.attrs.rowspan as number) > 1
  )
}

// Detects what kind of table selection (if any) the editor currently holds.
// Mirrors the verified prototype at `prototype/rte-table-bubble-menu`
// (apps/studio/src/pages/prototype/rte-table-bubble-menu.tsx) — see
// .scratch/rte-table-ux/issues/06-prototype-bubble-menu-content-layout.md for
// the content matrix this drives.
const detectSelectionType = (editor: Editor): SelectionKind => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return "none"

  const rect = selectedRect(editor.state)

  let allHeader = true
  selection.forEachCell((node) => {
    if (node.type.name !== "tableHeader") allHeader = false
  })

  const selectsSingleCellNode = isSingleCellSelection(selection)
  return getTableSelectionKind({
    spansEntireTableWidth: rect.left === 0 && rect.right === rect.map.width,
    spansEntireTableHeight: rect.top === 0 && rect.bottom === rect.map.height,
    allCellsAreHeaders: allHeader,
    // Exactly the first row/column (half-open span of 1). Broader selections
    // that merely overlap that edge stay ordinary row/column kinds.
    isTopRow: rect.top === 0 && rect.bottom === 1,
    isLeftmostColumn: rect.left === 0 && rect.right === 1,
    selectsSingleCellNode,
    selectedCellIsMerged: selectsSingleCellNode && isMergedCell(rect),
  })
}

// Move a selected block of rows/columns by swapping the adjacent neighbour
// past the whole block. `moveTableRow`/`moveTableColumn` expand around a
// single index (colspan/rowspan only), so passing `from: rect.left` for a
// multi-column selection only moves the first column — e.g. A,B right of
// A,B,C becomes B,A,C instead of C,A,B. Moving the neighbour into the
// selection's far edge relocates the entire block in one step.
const moveRow = (editor: Editor, direction: "up" | "down") => {
  const { state, view } = editor
  const rect = selectedRect(state)
  const plan = getRowMovePlan(
    {
      top: rect.top,
      bottom: rect.bottom,
      tableHeight: rect.map.height,
    },
    direction,
  )
  if (!plan) return

  // selectedRect.tableStart points inside the table; nodeAt needs the table's
  // own document position, one position earlier.
  const tablePos = rect.tableStart - 1

  moveTableRow({
    from: plan.from,
    to: plan.to,
    select: false,
    pos: rect.tableStart,
  })(state, (tr) => {
    const table = tr.doc.nodeAt(tablePos)
    if (!table) {
      view.dispatch(tr)
      return
    }
    const map = TableMap.get(table)
    const tableStart = tablePos + 1
    const newBottom = plan.newStart + plan.span
    // Reselect the moved block from its top-left to bottom-right cells.
    const anchor = map.positionAt(plan.newStart, 0, table)
    const head = map.positionAt(newBottom - 1, map.width - 1, table)
    tr.setSelection(
      CellSelection.create(tr.doc, tableStart + anchor, tableStart + head),
    )
    view.dispatch(tr)
  })
}

const moveColumn = (editor: Editor, direction: "left" | "right") => {
  const { state, view } = editor
  const rect = selectedRect(state)
  const plan = getColumnMovePlan(
    {
      left: rect.left,
      right: rect.right,
      tableWidth: rect.map.width,
    },
    direction,
  )
  if (!plan) return

  // selectedRect.tableStart points inside the table; nodeAt needs the table's
  // own document position, one position earlier.
  const tablePos = rect.tableStart - 1

  moveTableColumn({
    from: plan.from,
    to: plan.to,
    select: false,
    pos: rect.tableStart,
  })(state, (tr) => {
    const table = tr.doc.nodeAt(tablePos)
    if (!table) {
      view.dispatch(tr)
      return
    }
    const map = TableMap.get(table)
    const tableStart = tablePos + 1
    const newRight = plan.newStart + plan.span
    // CellSelection accepts either diagonal. Starting at the bottom-left
    // preserves TipTap's full-column selection orientation after the move.
    const anchor = map.positionAt(map.height - 1, plan.newStart, table)
    const head = map.positionAt(0, newRight - 1, table)
    tr.setSelection(
      CellSelection.create(tr.doc, tableStart + anchor, tableStart + head),
    )
    view.dispatch(tr)
  })
}

const ActionButton = ({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: ReactElement
  onClick: () => void
}) => (
  <Button
    size="xs"
    variant="clear"
    colorScheme="neutral"
    onClick={onClick}
    leftIcon={icon}
    w="100%"
    textAlign="left"
    sx={{
      justifyContent: "flex-start",
    }}
  >
    {label}
  </Button>
)

const ActionGroup = ({ children }: { children: ReactNode }) => (
  <VStack align="stretch" gap="0" w="100%">
    {children}
  </VStack>
)

const ActionDivider = () => (
  <Divider borderColor="base.divider.medium" my="0.25rem" opacity={1} />
)

// Label + switch — one control for set/unset instead of separate action
// buttons. TipTap toolbar pattern: preventDefault on mousedown so the click
// does not steal focus (and thus CellSelection) from the editor.
// Text uses the same subhead-2 sizing as ActionButton (Button size="xs");
// Switch `sm` is the smallest size in the design system.
const HeaderToggle = ({
  label,
  isChecked,
  onToggle,
}: {
  label: string
  isChecked: boolean
  onToggle: () => void
}) => (
  <Flex
    w="100%"
    minH="2.25rem"
    align="center"
    justify="space-between"
    px="15px"
    gap="0.5rem"
    onMouseDown={(event) => event.preventDefault()}
  >
    <Text textStyle="subhead-2">{label}</Text>
    <Switch
      size="sm"
      isChecked={isChecked}
      onChange={onToggle}
      aria-label={label}
    />
  </Flex>
)

type SelectionRect = ReturnType<typeof selectedRect>

const RowSelectionActions = ({
  editor,
  rect,
}: {
  editor: Editor
  rect: SelectionRect
}) => {
  const canMoveUp = rect.top > 0
  const canMoveDown = rect.bottom < rect.map.height
  // TipTap's toggleHeaderRow always rewrites the first table row only — show
  // the switch for that exact row, not for a multi-row selection that merely
  // overlaps it.
  const showHeaderToggle = rect.top === 0 && rect.bottom === 1
  const includesHeaderRow = selectionIncludesHeaderRow(rect)

  return (
    <>
      {showHeaderToggle && (
        <>
          <ActionGroup>
            <HeaderToggle
              label="Header row"
              isChecked={includesHeaderRow}
              onToggle={() => editor.chain().focus().toggleHeaderRow().run()}
            />
          </ActionGroup>
          <ActionDivider />
        </>
      )}
      <ActionGroup>
        <ActionButton
          label="Add row above"
          icon={<IconAddRowAbove boxSize="1rem" />}
          onClick={() => editor.chain().focus().addRowBefore().run()}
        />
        <ActionButton
          label="Add row below"
          icon={<IconAddRowBelow boxSize="1rem" />}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        />
      </ActionGroup>
      {(canMoveUp || canMoveDown) && (
        <>
          <ActionDivider />
          <ActionGroup>
            {canMoveUp && (
              <ActionButton
                label="Move up"
                icon={<BiUpArrowAlt fontSize="1rem" />}
                onClick={() => moveRow(editor, "up")}
              />
            )}
            {canMoveDown && (
              <ActionButton
                label="Move down"
                icon={<BiDownArrowAlt fontSize="1rem" />}
                onClick={() => moveRow(editor, "down")}
              />
            )}
          </ActionGroup>
        </>
      )}
      {!includesHeaderRow && (
        <>
          <ActionDivider />
          <ActionGroup>
            <ActionButton
              label="Delete row"
              icon={<IconDelRow boxSize="1rem" />}
              onClick={() => editor.chain().focus().deleteRow().run()}
            />
          </ActionGroup>
        </>
      )}
    </>
  )
}

const ColumnSelectionActions = ({
  editor,
  rect,
}: {
  editor: Editor
  rect: SelectionRect
}) => {
  const canMoveLeft = rect.left > 0
  const canMoveRight = rect.right < rect.map.width
  // TipTap's toggleHeaderColumn always rewrites the first table column only —
  // show the switch for that exact column, not for a multi-column selection
  // that merely overlaps it.
  const showHeaderToggle = rect.left === 0 && rect.right === 1
  const includesHeaderColumn = selectionIncludesHeaderColumn(rect)

  return (
    <>
      {showHeaderToggle && (
        <>
          <ActionGroup>
            <HeaderToggle
              label="Header column"
              isChecked={includesHeaderColumn}
              onToggle={() => editor.chain().focus().toggleHeaderColumn().run()}
            />
          </ActionGroup>
          <ActionDivider />
        </>
      )}
      <ActionGroup>
        <ActionButton
          label="Add column left"
          icon={<IconAddColLeft boxSize="1rem" />}
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        />
        <ActionButton
          label="Add column right"
          icon={<IconAddColRight boxSize="1rem" />}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        />
      </ActionGroup>
      {(canMoveLeft || canMoveRight) && (
        <>
          <ActionDivider />
          <ActionGroup>
            {canMoveLeft && (
              <ActionButton
                label="Move left"
                icon={<BiLeftArrowAlt fontSize="1rem" />}
                onClick={() => moveColumn(editor, "left")}
              />
            )}
            {canMoveRight && (
              <ActionButton
                label="Move right"
                icon={<BiRightArrowAlt fontSize="1rem" />}
                onClick={() => moveColumn(editor, "right")}
              />
            )}
          </ActionGroup>
        </>
      )}
      {!includesHeaderColumn && (
        <>
          <ActionDivider />
          <ActionGroup>
            <ActionButton
              label="Delete column"
              icon={<IconDelCol boxSize="1rem" />}
              onClick={() => editor.chain().focus().deleteColumn().run()}
            />
          </ActionGroup>
        </>
      )}
    </>
  )
}

const TableSelectionActions = ({
  editor,
  kind,
}: {
  editor: Editor
  kind: SelectionKind
}) => {
  switch (kind) {
    case "row":
    case "header-row":
      return (
        <RowSelectionActions
          editor={editor}
          rect={selectedRect(editor.state)}
        />
      )
    case "column":
    case "header-column":
      return (
        <ColumnSelectionActions
          editor={editor}
          rect={selectedRect(editor.state)}
        />
      )
    case "table":
      return (
        <ActionButton
          label="Delete table"
          icon={<BiTrash fontSize="1rem" />}
          onClick={() => editor.chain().focus().deleteTable().run()}
        />
      )
    case "multi-cell":
      return (
        <ActionButton
          label="Merge cells"
          icon={<IconMergeCells boxSize="1rem" />}
          onClick={() => editor.chain().focus().mergeCells().run()}
        />
      )
    case "merged-cell":
      return (
        <ActionButton
          label="Split cell"
          icon={<IconSplitCell boxSize="1rem" />}
          onClick={() => editor.chain().focus().splitCell().run()}
        />
      )
    default:
      return null
  }
}

// Stable module-level reference. `useTextEditor` runs with
// `shouldRerenderOnTransaction: true`, so every transaction re-renders every
// editor consumer, including this component. If `shouldShow` were a fresh
// inline closure on each render, TipTap's BubbleMenu would treat it as changed
// props and re-register its plugin, which dispatches a transaction — which
// triggers another re-render, forever. Keeping this function reference stable
// across renders is what breaks that loop. See
// .scratch/rte-table-ux/issues/06-prototype-bubble-menu-content-layout.md.
//
// Only CellSelections that have table actions (row/column/table/merge/split)
// show the menu. A plain text cursor inside a cell must not.
// Require editor (or menu) focus — TipTap's default shouldShow does this.
//
// Also stay hidden while prosemirror-tables is mid cell-drag
// (`tableEditingKey` is set in mousemove, cleared to null on mouseup) so the
// menu only settles after the drag commits — not for every intermediate rect.
const shouldShowTableBubbleMenu = ({
  editor,
  view,
  element,
}: {
  editor: Editor
  view: Editor["view"]
  element: HTMLElement
}) => {
  if (tableEditingKey.getState(view.state) != null) return false

  const kind = detectSelectionType(editor)
  if (kind === "none" || kind === "single-cell") return false

  const isChildOfMenu = element.contains(document.activeElement)
  return view.hasFocus() || isChildOfMenu
}

// Immediate show/hide once `shouldShow` flips — TipTap's default 250ms delay
// would keep a stale menu visible into the start of a drag, then lag the
// post-mouseup reveal. Drag gating is handled by `tableEditingKey` above.
const TABLE_BUBBLE_MENU_UPDATE_DELAY = 0

// `fixed` escapes the editor's overflow:auto clipping (absolute positioning
// anchors inside EditorContent and the menu gets clipped above the selection).
// Do NOT appendTo document.body — TipTap's blur handler treats any body focus
// target as "inside the menu" via parentNode.contains and hangs FocusLock.
const TABLE_BUBBLE_MENU_OPTIONS = {
  strategy: "fixed" as const,
  placement: "top" as const,
  offset: 8,
}

// Stable explicit plugin key so we can nudge TipTap's show/hide when
// `tableEditingKey` flips without a selection/doc change (mouseup only clears
// the selectingCells meta — TipTap's BubbleMenu early-returns on those and
// would otherwise never re-run `shouldShow`).
const TABLE_BUBBLE_MENU_PLUGIN_KEY = new PluginKey("tableBubbleMenu")

// TipTap's `show` meta runs `updatePosition()` *before* `show()`, and
// `updatePosition` no-ops while `!isVisible` — so a bare `show` meta leaves
// the menu unpositioned (often effectively invisible). Show first, then
// position.
const revealTableBubbleMenu = (editor: Editor) => {
  if (
    !shouldShowTableBubbleMenu({
      editor,
      view: editor.view,
      element: editor.view.dom,
    })
  ) {
    editor.view.dispatch(
      editor.state.tr.setMeta(TABLE_BUBBLE_MENU_PLUGIN_KEY, "hide"),
    )
    return
  }
  editor.view.dispatch(
    editor.state.tr.setMeta(TABLE_BUBBLE_MENU_PLUGIN_KEY, "show"),
  )
  editor.view.dispatch(
    editor.state.tr.setMeta(TABLE_BUBBLE_MENU_PLUGIN_KEY, "updatePosition"),
  )
}

const useTableBubbleMenuDragSync = (editor: Editor) => {
  useEffect(() => {
    const onTransaction = ({
      transaction,
    }: {
      transaction: { getMeta: (key: typeof tableEditingKey) => unknown }
    }) => {
      if (transaction.getMeta(tableEditingKey) === undefined) return

      queueMicrotask(() => {
        if (editor.isDestroyed) return
        if (tableEditingKey.getState(editor.state) != null) {
          editor.view.dispatch(
            editor.state.tr.setMeta(TABLE_BUBBLE_MENU_PLUGIN_KEY, "hide"),
          )
          return
        }
        revealTableBubbleMenu(editor)
      })
    }
    editor.on("transaction", onTransaction)
    return () => {
      editor.off("transaction", onTransaction)
    }
  }, [editor])
}

// memo: parent Editor re-renders on every TipTap transaction, including the
// blur/focus meta transactions Chakra Modal FocusLock generates. TipTap's
// BubbleMenu React wrapper re-runs useMenuElementProps on each render (fresh
// restProps object) and fights FocusLock → tab hang when opening Table
// Settings. Skipping parent-driven re-renders breaks that loop.
//
// Re-render only on selectionUpdate/update (not blur/focus meta) so kind and
// move-edge affordances stay correct without FocusLock thrash.
export const TableBubbleMenu = memo(function TableBubbleMenu({
  editor,
}: TableBubbleMenuProps) {
  // TipTap's selector replaces manual event subscriptions. Document identity
  // represents `update`; Selection.eq represents `selectionUpdate`. Meta-only
  // blur/focus transactions compare equal and therefore do not re-render.
  const { kind } = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      kind: detectSelectionType(currentEditor),
      doc: currentEditor.state.doc,
      selection: currentEditor.state.selection,
    }),
    equalityFn: (previous, next) =>
      next !== null &&
      previous.doc === next.doc &&
      previous.selection.eq(next.selection),
  })

  // TipTap early-returns when selection/doc are unchanged, so mouseup's
  // meta-only `tableEditingKey: -1` never re-runs `shouldShow`. After that
  // (or an explicit hide while selecting) force hide/reveal.
  useTableBubbleMenuDragSync(editor)

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={TABLE_BUBBLE_MENU_PLUGIN_KEY}
      shouldShow={shouldShowTableBubbleMenu}
      updateDelay={TABLE_BUBBLE_MENU_UPDATE_DELAY}
      options={TABLE_BUBBLE_MENU_OPTIONS}
    >
      <VStack
        align="stretch"
        textAlign="left"
        position="relative"
        zIndex="dropdown"
        bg="base.canvas.default"
        boxShadow="md"
        borderRadius="md"
        border="1px solid"
        borderColor="base.divider.medium"
        p="0.375rem"
        gap="0"
      >
        <TableSelectionActions editor={editor} kind={kind} />
      </VStack>
    </BubbleMenu>
  )
})
