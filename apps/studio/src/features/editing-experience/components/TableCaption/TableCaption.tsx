import type { Editor, JSONContent } from "@tiptap/react"
import { Flex, Icon, Text, Tooltip, useDisclosure } from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { lazy, Suspense, useState } from "react"
import { BiExpand, BiPencil } from "react-icons/bi"
import { TableSettingsModal } from "~/features/editing-experience/components/TableSettingsModal/TableSettingsModal"

import { isPlaceholderTableCaption } from "./utils"

// Lazy so the node view does not statically import the editor hook. That hook
// loads this node view and would cycle.
const TableFocusEditorModal = lazy(() =>
  import("./TableFocusEditorModal").then((module) => ({
    default: module.TableFocusEditorModal,
  })),
)

export interface TableCaptionProps {
  caption: string
  onCaptionChange: (caption: string) => void
  editor: Editor
  getPos: () => number | undefined
  table: JSONContent
  showTableEditorButton?: boolean
}

export const TableCaption = ({
  caption,
  onCaptionChange,
  editor,
  getPos,
  table,
  showTableEditorButton = true,
}: TableCaptionProps) => {
  const {
    isOpen: isTableSettingsModalOpen,
    onOpen: onTableSettingsModalOpen,
    onClose: onTableSettingsModalClose,
  } = useDisclosure()
  const {
    isOpen: isTableEditorModalOpen,
    onOpen: onTableEditorModalOpen,
    onClose: onTableEditorModalClose,
  } = useDisclosure()
  // Stay mounted through the close transition. Unmounting with isOpen still
  // true skips Chakra's exit animation.
  const [isTableEditorPresent, setIsTableEditorPresent] = useState(false)

  const hasCaption = !isPlaceholderTableCaption(caption)

  return (
    <>
      <Flex align="center" justify="space-between" gap="0.25rem" w="100%">
        <Text
          flex="1"
          minW={0}
          textStyle="caption-2"
          color={hasCaption ? "base.content.default" : "base.content.medium"}
          whiteSpace="normal"
          wordBreak="break-word"
        >
          {caption}
        </Text>
        <Flex align="center" gap="0.25rem" flexShrink={0}>
          <Button
            variant="clear"
            size="xs"
            leftIcon={
              <Icon
                as={BiPencil}
                color="interaction.links.default"
                boxSize="1rem"
              />
            }
            color="interaction.links.default"
            textStyle="caption-1"
            padding="0.5rem"
            flexShrink={0}
            onClick={onTableSettingsModalOpen}
            aria-label={hasCaption ? "Edit table caption" : "Add table caption"}
          >
            {hasCaption ? "Edit caption" : "Add caption"}
          </Button>
          {showTableEditorButton && (
            <Tooltip label="Expand table" hasArrow openDelay={500}>
              <IconButton
                variant="clear"
                size="xs"
                aria-label="Expand table"
                color="interaction.links.default"
                icon={
                  <Icon
                    as={BiExpand}
                    color="interaction.links.default"
                    boxSize="1rem"
                  />
                }
                flexShrink={0}
                onClick={() => {
                  setIsTableEditorPresent(true)
                  onTableEditorModalOpen()
                }}
              />
            </Tooltip>
          )}
        </Flex>
      </Flex>

      {/* Unmount while closed so defaultValues match the caption at open time. */}
      {isTableSettingsModalOpen && (
        <TableSettingsModal
          caption={caption}
          isOpen
          onClose={onTableSettingsModalClose}
          onSave={onCaptionChange}
        />
      )}

      {showTableEditorButton && isTableEditorPresent && (
        <Suspense fallback={null}>
          <TableFocusEditorModal
            table={table}
            parentEditor={editor}
            getPos={getPos}
            isOpen={isTableEditorModalOpen}
            onClose={onTableEditorModalClose}
            onExited={() => setIsTableEditorPresent(false)}
          />
        </Suspense>
      )}
    </>
  )
}
