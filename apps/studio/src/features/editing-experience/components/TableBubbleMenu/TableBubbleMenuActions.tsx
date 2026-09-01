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

import type {
  SelectionKind,
  TableMoveAxis,
  TableMovePlan,
} from "./TableBubbleMenu.types"
import {
  getSelectionBackgroundColorState,
  setSelectedCellsBackgroundColor,
  type SelectionBackgroundColorState,
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

const ClearContentsButton = ({ editor }: { editor: Editor }) => (
  <ActionButton
    label="Clear contents"
    icon={<BiX fontSize="1rem" />}
    onClick={() => clearSelectedCells(editor)}
  />
)

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
  state: SelectionBackgroundColorState
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

// Whole-table and no selection have nothing useful to color; every other
// CellSelection kind can, as long as it isn't a mixed header+body block.
const BackgroundColor = ({
  editor,
  kind,
  onColorSet,
}: {
  editor: Editor
  kind: SelectionKind
  onColorSet: () => void
}) => {
  if (kind === "none" || kind === "table") return null

  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return null

  const state = getSelectionBackgroundColorState(selection)
  if (!state.canSet) return null

  return (
    <BackgroundColorSection
      state={state}
      onSetColor={(color) => {
        setSelectedCellsBackgroundColor(editor, color)
        onColorSet()
      }}
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
      {!includesHeader && (
        <ActionButton
          label="Add row above"
          icon={<IconAddRowAbove boxSize="1rem" />}
          onClick={() => editor.chain().focus().addRowBefore().run()}
        />
      )}
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
      <ClearContentsButton editor={editor} />
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
      {!includesHeader && (
        <ActionButton
          label="Add column left"
          icon={<IconAddColLeft boxSize="1rem" />}
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        />
      )}
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
      <ClearContentsButton editor={editor} />
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

const SelectionActions = ({
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
        <ActionGroup>
          <ClearContentsButton editor={editor} />
          <ActionButton
            label="Delete table"
            icon={<BiTrash fontSize="1rem" />}
            onClick={() => editor.chain().focus().deleteTable().run()}
          />
        </ActionGroup>
      )
    case "multi-cell":
      return (
        <ActionGroup>
          <ClearContentsButton editor={editor} />
          <ActionButton
            label="Merge cells"
            icon={<IconMergeCells boxSize="1rem" />}
            onClick={() => editor.chain().focus().mergeCells().run()}
          />
        </ActionGroup>
      )
    case "single-cell":
      return (
        <ActionGroup>
          <ClearContentsButton editor={editor} />
        </ActionGroup>
      )
    case "merged-cell":
      return (
        <ActionGroup>
          <ClearContentsButton editor={editor} />
          <ActionButton
            label="Split cell"
            icon={<IconSplitCell boxSize="1rem" />}
            onClick={() => editor.chain().focus().splitCell().run()}
          />
        </ActionGroup>
      )
    default:
      return null
  }
}

// Action list rendered above the pencil trigger when the menu is activated.
export const TableBubbleMenuActions = ({
  editor,
  kind,
  onColorSet,
}: {
  editor: Editor
  kind: SelectionKind
  onColorSet: () => void
}) => (
  <>
    <SelectionActions editor={editor} kind={kind} />
    <BackgroundColor editor={editor} kind={kind} onColorSet={onColorSet} />
  </>
)
