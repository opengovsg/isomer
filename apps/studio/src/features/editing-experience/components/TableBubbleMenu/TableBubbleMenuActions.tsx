import type { TableCellBackgroundColorToken } from "@opengovsg/isomer-components"
import type { Editor } from "@tiptap/react"
import type { ReactElement, ReactNode } from "react"
import { Box, Flex, Text, VStack } from "@chakra-ui/react"
import { Button, Switch } from "@opengovsg/design-system-react"
import {
  TABLE_CELL_BACKGROUND_COLORS,
  TABLE_CELL_BACKGROUND_COLOR_TOKENS,
} from "@opengovsg/isomer-components"
import {
  CellSelection,
  moveTableColumn,
  moveTableRow,
  selectedRect,
} from "@tiptap/pm/tables"
import {
  BiCopy,
  BiDownArrowAlt,
  BiLeftArrowAlt,
  BiRightArrowAlt,
  BiTrash,
  BiUpArrowAlt,
  BiX,
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
  captureTableCommand,
  type TableCommandOutcome,
} from "~/lib/analytics/rteTable"

import type {
  SelectionKind,
  TableMoveAxis,
  TableMovePlan,
} from "./TableBubbleMenu.types"
import {
  getSelectionBackgroundColorState,
  setSelectedCellsBackgroundColor,
} from "./TableBubbleMenu.backgroundColor"
import { clearSelectedCells } from "./TableBubbleMenu.clear"
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
): TableCommandOutcome => {
  const { state, view } = editor
  const rect = selectedRect(state)
  const tablePos = rect.tableStart - 1
  const move = axis === "row" ? moveTableRow : moveTableColumn

  const moved = move({
    from: plan.from,
    to: plan.to,
    select: false,
    pos: rect.tableStart,
  })(state, (tr) => {
    restoreMovedBlockSelection(view, tr, tablePos, plan, axis)
  })
  if (!moved) return "rejected"

  editor.commands.focus()
  return "applied"
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

const ClearContentsButton = ({
  editor,
  kind,
  siteId,
}: {
  editor: Editor
  kind: SelectionKind
  siteId: number
}) => {
  return (
    <ActionButton
      label="Clear contents"
      icon={<BiX fontSize="1rem" />}
      onClick={() =>
        captureTableCommand({
          siteId,
          selectionKind: kind,
          source: "bubble_menu",
          action: "clear_contents",
          outcome: clearSelectedCells(editor),
        })
      }
    />
  )
}

const colorSwatchLabel = (color: string) =>
  `${color.charAt(0).toUpperCase()}${color.slice(1)}`

// Studio-only circle borders for palette swatches; published cells use fill.
const TABLE_CELL_PALETTE_COLOR_BORDERS: Record<
  (typeof TABLE_CELL_BACKGROUND_COLOR_TOKENS)[number],
  string
> = {
  pink: "#F59BDD",
  yellow: "#F8BE22",
  green: "#7FB894",
  blue: "#8C93E4",
  purple: "#BE8CE4",
}

const NONE_COLOR_SWATCH = {
  fill: "#F7F7F7",
  border: "#959595",
} as const

const ColorSwatch = ({
  label,
  fill,
  borderColor,
  isActive,
  onClick,
}: {
  label: string
  fill: string
  borderColor: string
  isActive: boolean
  onClick: () => void
}) => (
  <Button
    variant="unstyled"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    p="0.25rem"
    h="auto"
    minH="unset"
    minW="unset"
    flexShrink={0}
    borderRadius="0.25rem"
    border="none"
    aria-label={label}
    bg={isActive ? "interaction.muted.main.active" : "transparent"}
    _hover={{
      bg: isActive
        ? "interaction.muted.main.active"
        : "interaction.muted.main.hover",
    }}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    <Box
      as="span"
      boxSize="1.25rem"
      borderRadius="full"
      backgroundColor={fill}
      border="1px solid"
      borderColor={borderColor}
    />
  </Button>
)

const PaletteColorSwatch = ({
  color,
  isActive,
  onSetColor,
}: {
  color: (typeof TABLE_CELL_BACKGROUND_COLOR_TOKENS)[number]
  isActive: boolean
  onSetColor: (color: TableCellBackgroundColorToken | null) => void
}) => (
  <ColorSwatch
    label={colorSwatchLabel(color)}
    fill={TABLE_CELL_BACKGROUND_COLORS[color]}
    borderColor={TABLE_CELL_PALETTE_COLOR_BORDERS[color]}
    isActive={isActive}
    onClick={() => onSetColor(color)}
  />
)

const BackgroundColorSection = ({
  state,
  onSetColor,
}: {
  state: ReturnType<typeof getSelectionBackgroundColorState>
  onSetColor: (color: TableCellBackgroundColorToken | null) => void
}) => {
  const { isUniform, uniformColor: activeColor } = state

  return (
    <VStack align="stretch" gap="0">
      <Text
        textStyle="caption-3"
        color="base.content.medium"
        pt="0.625rem"
        pb="0.375rem"
        px="0.75rem"
      >
        Set background color
      </Text>
      <Flex gap="0.5rem" align="center" wrap="wrap" px="0.75rem">
        <ColorSwatch
          label="None"
          fill={NONE_COLOR_SWATCH.fill}
          borderColor={NONE_COLOR_SWATCH.border}
          isActive={isUniform && activeColor === null}
          onClick={() => onSetColor(null)}
        />
        {TABLE_CELL_BACKGROUND_COLOR_TOKENS.map((color) => (
          <PaletteColorSwatch
            key={color}
            color={color}
            isActive={isUniform && activeColor === color}
            onSetColor={onSetColor}
          />
        ))}
      </Flex>
    </VStack>
  )
}

const BackgroundColor = ({
  editor,
  kind,
  onColorSet,
  siteId,
}: {
  editor: Editor
  kind: SelectionKind
  onColorSet: () => void
  siteId: number
}) => {
  if (kind === "none") return null

  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return null

  const state = getSelectionBackgroundColorState(selection)

  return (
    <BackgroundColorSection
      state={state}
      onSetColor={(color) => {
        captureTableCommand({
          siteId,
          selectionKind: kind,
          source: "bubble_menu",
          action: "set_cell_background",
          outcome: setSelectedCellsBackgroundColor(editor, color),
        })
        onColorSet()
      }}
    />
  )
}

const MergeCellsButton = ({
  editor,
  kind,
  siteId,
}: {
  editor: Editor
  kind: SelectionKind
  siteId: number
}) => {
  return (
    <ActionButton
      label="Merge cells"
      icon={<IconMergeCells boxSize="1rem" />}
      onClick={() =>
        captureTableCommand({
          siteId,
          selectionKind: kind,
          source: "bubble_menu",
          action: "merge_cells",
          outcome: editor.chain().focus().mergeCells().run()
            ? "applied"
            : "rejected",
        })
      }
    />
  )
}

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

const RowSelectionActions = ({
  editor,
  rect,
  kind,
  siteId,
}: {
  editor: Editor
  rect: SelectionRect
  kind: SelectionKind
  siteId: number
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
          onToggle={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "toggle_header_row",
              outcome: editor.chain().focus().toggleHeaderRow().run()
                ? "applied"
                : "rejected",
            })
          }
        />
      )}
      {!includesHeader && (
        <ActionButton
          label="Add row above"
          icon={<IconAddRowAbove boxSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "add_row",
              outcome: editor.chain().focus().addRowBefore().run()
                ? "applied"
                : "rejected",
            })
          }
        />
      )}
      <ActionButton
        label="Add row below"
        icon={<IconAddRowBelow boxSize="1rem" />}
        onClick={() =>
          captureTableCommand({
            siteId,
            selectionKind: kind,
            source: "bubble_menu",
            action: "add_row",
            outcome: editor.chain().focus().addRowAfter().run()
              ? "applied"
              : "rejected",
          })
        }
      />
      {!includesHeader && (
        <ActionButton
          label="Duplicate row"
          icon={<BiCopy fontSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "duplicate_row",
              outcome: duplicateSelectedRows(editor),
            })
          }
        />
      )}
      <ClearContentsButton editor={editor} kind={kind} siteId={siteId} />
      <MergeCellsButton editor={editor} kind={kind} siteId={siteId} />
      {rowMoveUpPlan && !includesHeader && (
        <ActionButton
          label="Move up"
          icon={<BiUpArrowAlt fontSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "move_row",
              outcome: moveTableBlock(editor, rowMoveUpPlan, "row"),
            })
          }
        />
      )}
      {rowMoveDownPlan && !includesHeader && (
        <ActionButton
          label="Move down"
          icon={<BiDownArrowAlt fontSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "move_row",
              outcome: moveTableBlock(editor, rowMoveDownPlan, "row"),
            })
          }
        />
      )}
      {!includesHeader && (
        <ActionButton
          label="Delete row"
          icon={<IconDelRow boxSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "delete_row",
              outcome: editor.chain().focus().deleteRow().run()
                ? "applied"
                : "rejected",
            })
          }
        />
      )}
    </ActionGroup>
  )
}

const ColumnSelectionActions = ({
  editor,
  rect,
  kind,
  siteId,
}: {
  editor: Editor
  rect: SelectionRect
  kind: SelectionKind
  siteId: number
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
          onToggle={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "toggle_header_column",
              outcome: editor.chain().focus().toggleHeaderColumn().run()
                ? "applied"
                : "rejected",
            })
          }
        />
      )}
      {!includesHeader && (
        <ActionButton
          label="Add column left"
          icon={<IconAddColLeft boxSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "add_column",
              outcome: editor.chain().focus().addColumnBefore().run()
                ? "applied"
                : "rejected",
            })
          }
        />
      )}
      <ActionButton
        label="Add column right"
        icon={<IconAddColRight boxSize="1rem" />}
        onClick={() =>
          captureTableCommand({
            siteId,
            selectionKind: kind,
            source: "bubble_menu",
            action: "add_column",
            outcome: editor.chain().focus().addColumnAfter().run()
              ? "applied"
              : "rejected",
          })
        }
      />
      {!includesHeader && (
        <ActionButton
          label="Duplicate column"
          icon={<BiCopy fontSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "duplicate_column",
              outcome: duplicateSelectedColumns(editor),
            })
          }
        />
      )}
      <ClearContentsButton editor={editor} kind={kind} siteId={siteId} />
      <MergeCellsButton editor={editor} kind={kind} siteId={siteId} />
      {columnMoveLeftPlan && !includesHeader && (
        <ActionButton
          label="Move left"
          icon={<BiLeftArrowAlt fontSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "move_column",
              outcome: moveTableBlock(editor, columnMoveLeftPlan, "column"),
            })
          }
        />
      )}
      {columnMoveRightPlan && !includesHeader && (
        <ActionButton
          label="Move right"
          icon={<BiRightArrowAlt fontSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "move_column",
              outcome: moveTableBlock(editor, columnMoveRightPlan, "column"),
            })
          }
        />
      )}
      {!includesHeader && (
        <ActionButton
          label="Delete column"
          icon={<IconDelCol boxSize="1rem" />}
          onClick={() =>
            captureTableCommand({
              siteId,
              selectionKind: kind,
              source: "bubble_menu",
              action: "delete_column",
              outcome: editor.chain().focus().deleteColumn().run()
                ? "applied"
                : "rejected",
            })
          }
        />
      )}
    </ActionGroup>
  )
}

const SelectionActions = ({
  editor,
  kind,
  siteId,
}: {
  editor: Editor
  kind: SelectionKind
  siteId: number
}) => {
  const rect = selectedRect(editor.state)

  switch (kind) {
    case "row":
    case "header-row":
      return (
        <RowSelectionActions
          editor={editor}
          rect={rect}
          kind={kind}
          siteId={siteId}
        />
      )
    case "column":
    case "header-column":
      return (
        <ColumnSelectionActions
          editor={editor}
          rect={rect}
          kind={kind}
          siteId={siteId}
        />
      )
    case "table":
      return (
        <ActionGroup>
          <ClearContentsButton editor={editor} kind={kind} siteId={siteId} />
          <ActionButton
            label="Delete table"
            icon={<BiTrash fontSize="1rem" />}
            onClick={() =>
              captureTableCommand({
                siteId,
                selectionKind: kind,
                source: "bubble_menu",
                action: "delete_table",
                outcome: editor.chain().focus().deleteTable().run()
                  ? "applied"
                  : "rejected",
              })
            }
          />
        </ActionGroup>
      )
    case "multi-cell":
      return (
        <ActionGroup>
          <ClearContentsButton editor={editor} kind={kind} siteId={siteId} />
          <MergeCellsButton editor={editor} kind={kind} siteId={siteId} />
        </ActionGroup>
      )
    case "single-cell":
      return (
        <ActionGroup>
          <ClearContentsButton editor={editor} kind={kind} siteId={siteId} />
        </ActionGroup>
      )
    case "merged-cell":
      return (
        <ActionGroup>
          <ClearContentsButton editor={editor} kind={kind} siteId={siteId} />
          <ActionButton
            label="Split cell"
            icon={<IconSplitCell boxSize="1rem" />}
            onClick={() =>
              captureTableCommand({
                siteId,
                selectionKind: kind,
                source: "bubble_menu",
                action: "split_cell",
                outcome: editor.chain().focus().splitCell().run()
                  ? "applied"
                  : "rejected",
              })
            }
          />
        </ActionGroup>
      )
    default:
      return null
  }
}

export const TableBubbleMenuActions = ({
  editor,
  kind,
  onColorSet,
  siteId,
}: {
  editor: Editor
  kind: SelectionKind
  onColorSet: () => void
  siteId: number
}) => (
  <>
    <SelectionActions editor={editor} kind={kind} siteId={siteId} />
    <BackgroundColor
      editor={editor}
      kind={kind}
      onColorSet={onColorSet}
      siteId={siteId}
    />
  </>
)
