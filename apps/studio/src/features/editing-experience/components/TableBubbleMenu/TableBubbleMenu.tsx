import type { ReactElement } from "react"
import type { Editor } from "@tiptap/react"
import { Button, VStack } from "@chakra-ui/react"
import {
  CellSelection,
  moveTableColumn,
  moveTableRow,
  selectedRect,
} from "@tiptap/pm/tables"
import { BubbleMenu } from "@tiptap/react/menus"
import {
  BiDownArrowAlt,
  BiHeading,
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

const moveRow = (editor: Editor, direction: "up" | "down") => {
  const rect = selectedRect(editor.state)
  const from = rect.top
  const to = direction === "up" ? rect.top - 1 : rect.top + 1
  if (to < 0 || to >= rect.map.height) return
  moveTableRow({ from, to })(editor.state, editor.view.dispatch)
}

const moveColumn = (editor: Editor, direction: "left" | "right") => {
  const rect = selectedRect(editor.state)
  const from = rect.left
  const to = direction === "left" ? rect.left - 1 : rect.left + 1
  if (to < 0 || to >= rect.map.width) return
  moveTableColumn({ from, to })(editor.state, editor.view.dispatch)
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
    variant="outline"
    onClick={onClick}
    leftIcon={icon}
    justifyContent="flex-start"
    w="100%"
  >
    {label}
  </Button>
)

const TableSelectionActions = ({
  editor,
  kind,
}: {
  editor: Editor
  kind: SelectionKind
}) => {
  const focus = editor.chain().focus()

  switch (kind) {
    case "row":
      return (
        <>
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
          <ActionButton
            label="Move up"
            icon={<BiUpArrowAlt fontSize="1rem" />}
            onClick={() => moveRow(editor, "up")}
          />
          <ActionButton
            label="Move down"
            icon={<BiDownArrowAlt fontSize="1rem" />}
            onClick={() => moveRow(editor, "down")}
          />
          <ActionButton
            label="Delete row"
            icon={<IconDelRow boxSize="1rem" />}
            onClick={() => focus.deleteRow().run()}
          />
        </>
      )
    case "header-row":
      return (
        <>
          <ActionButton
            label="Unset header row"
            icon={<BiHeading fontSize="1rem" />}
            onClick={() => focus.toggleHeaderRow().run()}
          />
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
          <ActionButton
            label="Move down"
            icon={<BiDownArrowAlt fontSize="1rem" />}
            onClick={() => moveRow(editor, "down")}
          />
        </>
      )
    case "column":
      return (
        <>
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
          <ActionButton
            label="Move left"
            icon={<BiLeftArrowAlt fontSize="1rem" />}
            onClick={() => moveColumn(editor, "left")}
          />
          <ActionButton
            label="Move right"
            icon={<BiRightArrowAlt fontSize="1rem" />}
            onClick={() => moveColumn(editor, "right")}
          />
          <ActionButton
            label="Delete column"
            icon={<IconDelCol boxSize="1rem" />}
            onClick={() => focus.deleteColumn().run()}
          />
          <ActionButton
            label="Set as header column"
            icon={<BiHeading fontSize="1rem" />}
            onClick={() => focus.toggleHeaderColumn().run()}
          />
        </>
      )
    case "header-column":
      return (
        <>
          <ActionButton
            label="Unset header column"
            icon={<BiHeading fontSize="1rem" />}
            onClick={() => focus.toggleHeaderColumn().run()}
          />
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
          <ActionButton
            label="Move left"
            icon={<BiLeftArrowAlt fontSize="1rem" />}
            onClick={() => moveColumn(editor, "left")}
          />
          <ActionButton
            label="Move right"
            icon={<BiRightArrowAlt fontSize="1rem" />}
            onClick={() => moveColumn(editor, "right")}
          />
          <ActionButton
            label="Delete column"
            icon={<IconDelCol boxSize="1rem" />}
            onClick={() => focus.deleteColumn().run()}
          />
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

// Stable module-level references. `useTextEditor` runs with
// `shouldRerenderOnTransaction: true`, so every transaction re-renders every
// editor consumer, including this component. If `shouldShow` / `options` /
// `appendTo` were fresh values on each render, TipTap's BubbleMenu would
// treat them as changed props and dispatch an options-update transaction —
// which triggers another re-render. Keeping these stable breaks that loop.
// See .scratch/rte-table-ux/issues/06-prototype-bubble-menu-content-layout.md.
//
// Only CellSelections that have table actions (row/column/table/merge/split)
// show the menu. A plain text cursor inside a cell must not — otherwise
// clicking into a cell floats Superscript/Subscript over the content.
//
// Also require editor (or menu) focus — TipTap's default shouldShow does this.
// Without it, opening Table Settings (or any modal) blurs the editor, the
// menu hides on blur, then the next transaction re-shows it on document.body
// where it fights Chakra's Modal focus lock and can hang the tab.
const shouldShowTableBubbleMenu = ({
  editor,
  view,
  element,
}: {
  editor: Editor
  view: Editor["view"]
  element: HTMLElement
}) => {
  const kind = detectSelectionType(editor)
  if (kind === "none" || kind === "single-cell") return false

  const isChildOfMenu = element.contains(document.activeElement)
  return view.hasFocus() || isChildOfMenu
}

// `fixed` + body append escapes the editor drawer / EditorContent overflow
// clipping that otherwise hides the menu (TipTap defaults to `absolute` and
// appends beside ProseMirror inside an overflow:auto ancestor).
const TABLE_BUBBLE_MENU_OPTIONS = {
  strategy: "fixed" as const,
  placement: "top" as const,
  offset: 8,
}

const getBubbleMenuAppendTo = () => document.body

// Stable style object — avoid a fresh `{}` each render (same footgun class as
// shouldShow / options / appendTo above, for attributes TipTap syncs).
const TABLE_BUBBLE_MENU_STYLE = {
  zIndex: "var(--chakra-zIndices-popover)",
} as const

export const TableBubbleMenu = ({ editor }: TableBubbleMenuProps) => {
  const kind = detectSelectionType(editor)

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShowTableBubbleMenu}
      updateDelay={0}
      options={TABLE_BUBBLE_MENU_OPTIONS}
      appendTo={getBubbleMenuAppendTo}
      style={TABLE_BUBBLE_MENU_STYLE}
    >
      <VStack
        align="stretch"
        bg="base.canvas.default"
        boxShadow="md"
        borderRadius="md"
        border="1px solid"
        borderColor="base.divider.medium"
        p="0.375rem"
        gap="0.25rem"
      >
        <TableSelectionActions editor={editor} kind={kind} />
      </VStack>
    </BubbleMenu>
  )
}
