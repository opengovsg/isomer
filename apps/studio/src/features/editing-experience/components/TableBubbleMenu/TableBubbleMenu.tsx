import type { ReactElement, ReactNode } from "react"
import type { Editor } from "@tiptap/react"
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
import { BubbleMenu } from "@tiptap/react/menus"
import { memo, useEffect, useState, useSyncExternalStore } from "react"
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

export interface TableBubbleMenuProps {
  editor: Editor
}

type SelectionKind =
  | "none"
  | "single-cell"
  | "merged-cell"
  | "row"
  | "header-row"
  | "column"
  | "header-column"
  | "table"
  | "multi-cell"

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

const isMergedCell = (editor: Editor): boolean => {
  const rect = selectedRect(editor.state)
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
  const isFullWidth = rect.left === 0 && rect.right === rect.map.width
  const isFullHeight = rect.top === 0 && rect.bottom === rect.map.height

  let allHeader = true
  selection.forEachCell((node) => {
    if (node.type.name !== "tableHeader") allHeader = false
  })

  if (isFullWidth && isFullHeight) return "table"
  if (isFullWidth) return allHeader ? "header-row" : "row"
  if (isFullHeight) return allHeader ? "header-column" : "column"
  if (isSingleCellSelection(selection)) {
    return isMergedCell(editor) ? "merged-cell" : "single-cell"
  }
  return "multi-cell"
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
  const rowCount = rect.bottom - rect.top
  const tablePos = rect.tableStart - 1

  let from: number
  let to: number
  let newTop: number

  if (direction === "up") {
    if (rect.top === 0) return
    from = rect.top - 1
    to = rect.bottom - 1
    newTop = rect.top - 1
  } else {
    if (rect.bottom >= rect.map.height) return
    from = rect.bottom
    to = rect.top
    newTop = rect.top + 1
  }

  moveTableRow({
    from,
    to,
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
    const newBottom = newTop + rowCount
    const anchor = map.positionAt(newTop, 0, table)
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
  const colCount = rect.right - rect.left
  const tablePos = rect.tableStart - 1

  let from: number
  let to: number
  let newLeft: number

  if (direction === "left") {
    if (rect.left === 0) return
    from = rect.left - 1
    to = rect.right - 1
    newLeft = rect.left - 1
  } else {
    if (rect.right >= rect.map.width) return
    from = rect.right
    to = rect.left
    newLeft = rect.left + 1
  }

  moveTableColumn({
    from,
    to,
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
    const newRight = newLeft + colCount
    const anchor = map.positionAt(map.height - 1, newLeft, table)
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

const TableSelectionActions = ({
  editor,
  kind,
}: {
  editor: Editor
  kind: SelectionKind
}) => {
  const focus = editor.chain().focus()

  const rect =
    kind === "row" ||
    kind === "header-row" ||
    kind === "column" ||
    kind === "header-column"
      ? selectedRect(editor.state)
      : null
  const canMoveLeft = rect !== null && rect.left > 0
  const canMoveRight = rect !== null && rect.right < rect.map.width
  const canMoveUp = rect !== null && rect.top > 0
  const canMoveDown = rect !== null && rect.bottom < rect.map.height
  const hasRowMoves = canMoveUp || canMoveDown
  const hasColumnMoves = canMoveLeft || canMoveRight
  // TipTap's toggleHeaderRow/Column always targets the first row/column, so
  // only offer the switch when that edge is part of the current selection.
  const showHeaderRow = rect !== null && rect.top === 0
  const showHeaderColumn = rect !== null && rect.left === 0

  switch (kind) {
    case "row":
      return (
        <>
          {showHeaderRow && (
            <>
              <ActionGroup>
                <HeaderToggle
                  label="Header row"
                  isChecked={false}
                  onToggle={() => focus.toggleHeaderRow().run()}
                />
              </ActionGroup>
              <ActionDivider />
            </>
          )}
          <ActionGroup>
            <ActionButton
              label="Add row above"
              icon={<IconAddRowAbove boxSize="1rem" />}
              onClick={() => focus.addRowBefore().run()}
            />
            <ActionButton
              label="Add row below"
              icon={<IconAddRowBelow boxSize="1rem" />}
              onClick={() => focus.addRowAfter().run()}
            />
          </ActionGroup>
          {hasRowMoves && (
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
          <ActionDivider />
          <ActionGroup>
            <ActionButton
              label="Delete row"
              icon={<IconDelRow boxSize="1rem" />}
              onClick={() => focus.deleteRow().run()}
            />
          </ActionGroup>
        </>
      )
    case "header-row":
      return (
        <>
          {showHeaderRow && (
            <>
              <ActionGroup>
                <HeaderToggle
                  label="Header row"
                  isChecked
                  onToggle={() => focus.toggleHeaderRow().run()}
                />
              </ActionGroup>
              <ActionDivider />
            </>
          )}
          <ActionGroup>
            <ActionButton
              label="Add row above"
              icon={<IconAddRowAbove boxSize="1rem" />}
              onClick={() => focus.addRowBefore().run()}
            />
            <ActionButton
              label="Add row below"
              icon={<IconAddRowBelow boxSize="1rem" />}
              onClick={() => focus.addRowAfter().run()}
            />
          </ActionGroup>
          {hasRowMoves && (
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
        </>
      )
    case "column":
      return (
        <>
          {showHeaderColumn && (
            <>
              <ActionGroup>
                <HeaderToggle
                  label="Header column"
                  isChecked={false}
                  onToggle={() => focus.toggleHeaderColumn().run()}
                />
              </ActionGroup>
              <ActionDivider />
            </>
          )}
          <ActionGroup>
            <ActionButton
              label="Add column left"
              icon={<IconAddColLeft boxSize="1rem" />}
              onClick={() => focus.addColumnBefore().run()}
            />
            <ActionButton
              label="Add column right"
              icon={<IconAddColRight boxSize="1rem" />}
              onClick={() => focus.addColumnAfter().run()}
            />
          </ActionGroup>
          {hasColumnMoves && (
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
          <ActionDivider />
          <ActionGroup>
            <ActionButton
              label="Delete column"
              icon={<IconDelCol boxSize="1rem" />}
              onClick={() => focus.deleteColumn().run()}
            />
          </ActionGroup>
        </>
      )
    case "header-column":
      return (
        <>
          {showHeaderColumn && (
            <>
              <ActionGroup>
                <HeaderToggle
                  label="Header column"
                  isChecked
                  onToggle={() => focus.toggleHeaderColumn().run()}
                />
              </ActionGroup>
              <ActionDivider />
            </>
          )}
          <ActionGroup>
            <ActionButton
              label="Add column left"
              icon={<IconAddColLeft boxSize="1rem" />}
              onClick={() => focus.addColumnBefore().run()}
            />
            <ActionButton
              label="Add column right"
              icon={<IconAddColRight boxSize="1rem" />}
              onClick={() => focus.addColumnAfter().run()}
            />
          </ActionGroup>
          {hasColumnMoves && (
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
          <ActionDivider />
          <ActionGroup>
            <ActionButton
              label="Delete column"
              icon={<IconDelCol boxSize="1rem" />}
              onClick={() => focus.deleteColumn().run()}
            />
          </ActionGroup>
        </>
      )
    case "table":
      return (
        <ActionButton
          label="Delete table"
          icon={<BiTrash fontSize="1rem" />}
          onClick={() => focus.deleteTable().run()}
        />
      )
    case "multi-cell":
      return (
        <ActionButton
          label="Merge cells"
          icon={<IconMergeCells boxSize="1rem" />}
          onClick={() => focus.mergeCells().run()}
        />
      )
    case "merged-cell":
      return (
        <ActionButton
          label="Split cell"
          icon={<IconSplitCell boxSize="1rem" />}
          onClick={() => focus.splitCell().run()}
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

// Stable explicit plugin key so we can nudge TipTap's show/hide when
// `tableEditingKey` flips without a selection/doc change (mouseup only clears
// the selectingCells meta — TipTap's BubbleMenu early-returns on those and
// would otherwise never re-run `shouldShow`).
const TABLE_BUBBLE_MENU_PLUGIN_KEY = new PluginKey("tableBubbleMenu")

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
  const [, setRevision] = useState(0)

  useEffect(() => {
    const sync = () => setRevision((n) => n + 1)
    editor.on("selectionUpdate", sync)
    editor.on("update", sync)
    return () => {
      editor.off("selectionUpdate", sync)
      editor.off("update", sync)
    }
  }, [editor])

  // Drive content off `tableEditingKey` as well: TipTap only re-runs
  // `shouldShow` when selection/doc changes, but mouseup clears selectingCells
  // with a meta-only transaction. Subscribing here unmounts actions mid-drag
  // and remounts them on commit even when TipTap's shell lag/early-return
  // would leave stale DOM briefly.
  const isSelectingCells = useSyncExternalStore(
    (onStoreChange) => {
      const sync = () => onStoreChange()
      editor.on("transaction", sync)
      return () => {
        editor.off("transaction", sync)
      }
    },
    () => tableEditingKey.getState(editor.state) != null,
    () => false,
  )

  // TipTap early-returns when selection/doc are unchanged, so meta-only
  // selectingCells transitions never re-run `shouldShow`. Nudge the plugin
  // shell hide/show after those transitions; TipTap's `show` meta skips
  // shouldShow, so only fire it when the menu is actually allowed.
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
        if (
          shouldShowTableBubbleMenu({
            editor,
            view: editor.view,
            // Menu element isn't available here; focus on the editor is the
            // practical gate after a cell drag (menu isn't focused mid-drag).
            element: editor.view.dom,
          })
        ) {
          editor.view.dispatch(
            editor.state.tr.setMeta(TABLE_BUBBLE_MENU_PLUGIN_KEY, "show"),
          )
          return
        }
        editor.view.dispatch(
          editor.state.tr.setMeta(TABLE_BUBBLE_MENU_PLUGIN_KEY, "hide"),
        )
      })
    }
    editor.on("transaction", onTransaction)
    return () => {
      editor.off("transaction", onTransaction)
    }
  }, [editor])

  const kind = detectSelectionType(editor)

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={TABLE_BUBBLE_MENU_PLUGIN_KEY}
      shouldShow={shouldShowTableBubbleMenu}
      updateDelay={TABLE_BUBBLE_MENU_UPDATE_DELAY}
    >
      {!isSelectingCells && (
        <VStack
          align="stretch"
          textAlign="left"
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
      )}
    </BubbleMenu>
  )
})
