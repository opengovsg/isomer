import type { Editor } from "@tiptap/react"
import {
  Box,
  Grid,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { useState } from "react"
import { BiTable } from "react-icons/bi"

export interface TableSizePickerProps {
  editor: Editor
}

const GRID_SIZE = 6

interface HoveredCell {
  row: number
  col: number
}

const TABLE_BUTTON_PROPS = {
  variant: "clear",
  colorScheme: "neutral",
  h: "1.75rem",
  w: "1.75rem",
  minH: "1.75rem",
  minW: "1.75rem",
  p: "0.25rem",
} as const

// While a table is selected, this stays a plain delete-table button — the
// grid picker below is only for inserting a NEW table. (Every in-table
// action, including delete, is also reachable from TableBubbleMenu once
// that ships from a separate branch; this fallback just means the
// capability isn't stranded if this one merges first.)
//
// This is only ever rendered while a table is active, so it's always in
// the "active" visual state — matching the old single Table button, which
// stayed highlighted for as long as the cursor was inside a table.
const DeleteTableButton = ({ editor }: { editor: Editor }) => (
  <IconButton
    {...TABLE_BUTTON_PROPS}
    isActive
    _active={{
      bg: "interaction.muted.main.active",
    }}
    aria-label="Delete table"
    onClick={() => editor.chain().focus().deleteTable().run()}
  >
    <Icon as={BiTable} fontSize="1.25rem" color="base.content.medium" />
  </IconButton>
)

const TableSizeGridPicker = ({ editor }: { editor: Editor }) => {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null)

  const insertTable = (row: number, col: number, onClose: () => void) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: row + 1, cols: col + 1, withHeaderRow: true })
      .run()
    setHoveredCell(null)
    onClose()
  }

  return (
    <Popover placement="bottom-start">
      {({ isOpen, onClose }) => (
        <>
          <PopoverTrigger>
            <IconButton
              {...TABLE_BUTTON_PROPS}
              isActive={isOpen}
              _active={{
                bg: "interaction.muted.main.active",
              }}
              aria-label="Table"
            >
              <Icon
                as={BiTable}
                fontSize="1.25rem"
                color="base.content.medium"
              />
            </IconButton>
          </PopoverTrigger>
          <PopoverContent
            w="fit-content"
            onMouseLeave={() => setHoveredCell(null)}
          >
            <PopoverBody>
              <VStack spacing="0.5rem">
                <Text textStyle="caption-2" color="base.content.medium">
                  {hoveredCell
                    ? `${hoveredCell.row + 1} × ${hoveredCell.col + 1}`
                    : "Insert table"}
                </Text>
                <Grid
                  templateColumns={`repeat(${GRID_SIZE}, 1fr)`}
                  gap="0.1875rem"
                  role="group"
                  aria-label="Select table size"
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
                    const row = Math.floor(index / GRID_SIZE)
                    const col = index % GRID_SIZE
                    const isHighlighted =
                      !!hoveredCell &&
                      row <= hoveredCell.row &&
                      col <= hoveredCell.col

                    return (
                      <Box
                        key={`${row}-${col}`}
                        as="button"
                        type="button"
                        aria-label={`${row + 1} by ${col + 1} table`}
                        w="1.25rem"
                        h="1.25rem"
                        border="1px solid"
                        borderColor={
                          isHighlighted
                            ? "interaction.main.default"
                            : "base.divider.strong"
                        }
                        bg={
                          isHighlighted
                            ? "interaction.main.default"
                            : "transparent"
                        }
                        cursor="pointer"
                        onMouseEnter={() => setHoveredCell({ row, col })}
                        onClick={() => insertTable(row, col, onClose)}
                      />
                    )
                  })}
                </Grid>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  )
}

export const TableSizePicker = ({
  editor,
}: TableSizePickerProps): JSX.Element => {
  if (editor.isActive("table")) {
    return <DeleteTableButton editor={editor} />
  }
  return <TableSizeGridPicker editor={editor} />
}
