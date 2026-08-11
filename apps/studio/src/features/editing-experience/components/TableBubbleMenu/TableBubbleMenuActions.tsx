import type { Editor } from "@tiptap/react"
import type { ReactElement, ReactNode } from "react"
import { Flex, Text, VStack } from "@chakra-ui/react"
import { Button, Switch } from "@opengovsg/design-system-react"
import { moveTableColumn, moveTableRow, selectedRect } from "@tiptap/pm/tables"
import {
  BiCopy,
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

import type {
  SelectionKind,
  TableMoveAxis,
  TableMovePlan,
} from "./TableBubbleMenu.types"
import {
  duplicateSelectedColumns,
  duplicateSelectedRows,
} from "./TableBubbleMenu.duplicate"
import {
  getColumnMovePlan,
  getRowMovePlan,
  restoreMovedBlockSelection,
  selectionIncludesHeaderColumn,
  selectionIncludesHeaderRow,
  selectionIsLeftmostColumn,
  selectionIsTopRow,
} from "./TableBubbleMenu.utils"

const moveTableBlock = (
  editor: Editor,
  plan: TableMovePlan,
  axis: TableMoveAxis,
) => {
  const { state, view } = editor
  const rect = selectedRect(state)
  const tablePos = rect.tableStart - 1
  const move = axis === "row" ? moveTableRow : moveTableColumn

  move({
    from: plan.from,
    to: plan.to,
    select: false,
    pos: rect.tableStart,
  })(state, (tr) => {
    restoreMovedBlockSelection(view, tr, tablePos, plan, axis)
  })
  // Unlike every sibling action, this dispatches its own transaction instead
  // of `.chain().focus()...run()` — restore focus explicitly so a real
  // mousedown-triggered blur doesn't strand it on the button.
  editor.commands.focus()
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
    // TipTap toolbar pattern: preventDefault on mousedown so the click does
    // not steal focus (and thus CellSelection) from the editor.
    onMouseDown={(event) => event.preventDefault()}
    w="100%"
    h="auto"
    minH="unset"
    px="0.75rem"
    py="0.625rem"
    color="base.content.strong"
    textAlign="left"
    sx={{
      justifyContent: "flex-start",
    }}
  >
    <Flex as="span" align="center" gap="0.5rem">
      {icon}
      <Text as="span" textStyle="body-2" color="base.content.strong">
        {label}
      </Text>
    </Flex>
  </Button>
)

const ActionGroup = ({ children }: { children: ReactNode }) => (
  <VStack align="stretch" gap="0" w="100%">
    {children}
  </VStack>
)

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
    px="0.75rem"
    gap="0.5rem"
    // Prevent editor blur when toggling header switches.
    onMouseDown={(event) => event.preventDefault()}
  >
    <Text textStyle="body-2" color="base.content.strong">
      {label}
    </Text>
    <Switch
      size="sm"
      isChecked={isChecked}
      onChange={onToggle}
      aria-label={label}
    />
  </Flex>
)

type SelectionRect = ReturnType<typeof selectedRect>

// Row-axis actions: header toggle only when the selection is exactly one row.
const RowSelectionActions = ({
  editor,
  rect,
}: {
  editor: Editor
  rect: SelectionRect
}) => {
  const includesHeader = selectionIncludesHeaderRow(rect)
  const rowMoveUpPlan = getRowMovePlan(
    { top: rect.top, bottom: rect.bottom, tableHeight: rect.map.height },
    "up",
  )
  const rowMoveDownPlan = getRowMovePlan(
    { top: rect.top, bottom: rect.bottom, tableHeight: rect.map.height },
    "down",
  )

  return (
    <ActionGroup>
      {selectionIsTopRow(rect) && (
        <HeaderToggle
          label="Header row"
          isChecked={includesHeader}
          onToggle={() => editor.chain().focus().toggleHeaderRow().run()}
        />
      )}
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
      {!includesHeader && (
        <ActionButton
          label="Duplicate row"
          icon={<BiCopy fontSize="1rem" />}
          onClick={() => duplicateSelectedRows(editor)}
        />
      )}
      {rowMoveUpPlan && !includesHeader && (
        <ActionButton
          label="Move up"
          icon={<BiUpArrowAlt fontSize="1rem" />}
          onClick={() => moveTableBlock(editor, rowMoveUpPlan, "row")}
        />
      )}
      {rowMoveDownPlan && !includesHeader && (
        <ActionButton
          label="Move down"
          icon={<BiDownArrowAlt fontSize="1rem" />}
          onClick={() => moveTableBlock(editor, rowMoveDownPlan, "row")}
        />
      )}
      {!includesHeader && (
        <ActionButton
          label="Delete row"
          icon={<IconDelRow boxSize="1rem" />}
          onClick={() => editor.chain().focus().deleteRow().run()}
        />
      )}
    </ActionGroup>
  )
}

// Column-axis actions: header toggle only when the selection is exactly one column.
const ColumnSelectionActions = ({
  editor,
  rect,
}: {
  editor: Editor
  rect: SelectionRect
}) => {
  const includesHeader = selectionIncludesHeaderColumn(rect)

  const columnMoveLeftPlan = getColumnMovePlan(
    { left: rect.left, right: rect.right, tableWidth: rect.map.width },
    "left",
  )

  const columnMoveRightPlan = getColumnMovePlan(
    { left: rect.left, right: rect.right, tableWidth: rect.map.width },
    "right",
  )

  return (
    <ActionGroup>
      {selectionIsLeftmostColumn(rect) && (
        <HeaderToggle
          label="Header column"
          isChecked={includesHeader}
          onToggle={() => editor.chain().focus().toggleHeaderColumn().run()}
        />
      )}
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
      {!includesHeader && (
        <ActionButton
          label="Duplicate column"
          icon={<BiCopy fontSize="1rem" />}
          onClick={() => duplicateSelectedColumns(editor)}
        />
      )}
      {columnMoveLeftPlan && !includesHeader && (
        <ActionButton
          label="Move left"
          icon={<BiLeftArrowAlt fontSize="1rem" />}
          onClick={() => moveTableBlock(editor, columnMoveLeftPlan, "column")}
        />
      )}
      {columnMoveRightPlan && !includesHeader && (
        <ActionButton
          label="Move right"
          icon={<BiRightArrowAlt fontSize="1rem" />}
          onClick={() => moveTableBlock(editor, columnMoveRightPlan, "column")}
        />
      )}
      {!includesHeader && (
        <ActionButton
          label="Delete column"
          icon={<IconDelCol boxSize="1rem" />}
          onClick={() => editor.chain().focus().deleteColumn().run()}
        />
      )}
    </ActionGroup>
  )
}

// Action list rendered above the pencil trigger when the menu is activated.
export const TableBubbleMenuActions = ({
  editor,
  kind,
}: {
  editor: Editor
  kind: SelectionKind
}) => {
  const rect = selectedRect(editor.state)

  switch (kind) {
    case "row":
    case "header-row":
      return <RowSelectionActions editor={editor} rect={rect} />
    case "column":
    case "header-column":
      return <ColumnSelectionActions editor={editor} rect={rect} />
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
