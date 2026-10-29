import type { Editor } from "@tiptap/react"
import { Flex, Icon, Text, Tooltip, useDisclosure } from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { useSyncExternalStore } from "react"
import { BiExpand, BiPencil, BiRevision } from "react-icons/bi"
import { TableSettingsModal } from "~/features/editing-experience/components/TableSettingsModal/TableSettingsModal"
import {
  getExpandedTablePos,
  setTableEditorExpanded,
  subscribeTableEditorExpanded,
} from "~/features/editing-experience/utils/expandTableEditor"

import { isPlaceholderTableCaption } from "./utils"

export interface TableCaptionProps {
  caption: string
  onCaptionChange: (caption: string) => void
  onResetColumnWidths?: () => void
  editor: Editor
  getPos: () => number | undefined
}

export const TableCaption = ({
  caption,
  onCaptionChange,
  onResetColumnWidths,
  editor,
  getPos,
}: TableCaptionProps) => {
  const {
    isOpen: isTableSettingsModalOpen,
    onOpen: onTableSettingsModalOpen,
    onClose: onTableSettingsModalClose,
  } = useDisclosure()

  const hasCaption = !isPlaceholderTableCaption(caption)
  const expanded = useSyncExternalStore(
    (listener) => subscribeTableEditorExpanded(editor, listener),
    () => getExpandedTablePos(editor) !== null,
    () => false,
  )

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
        <Flex align="center" gap="0.5rem" flexShrink={0}>
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
          {onResetColumnWidths && (
            <Tooltip label="Reset column width" hasArrow>
              <IconButton
                aria-label="Reset column width"
                variant="clear"
                color="interaction.links.default"
                fontSize="1rem"
                icon={<BiRevision />}
                minW="unset"
                minH="unset"
                h="auto"
                p="0.5rem"
                onClick={onResetColumnWidths}
              />
            </Tooltip>
          )}
          {!expanded && (
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
                  const tablePos = getPos()
                  if (typeof tablePos !== "number") return
                  setTableEditorExpanded(editor, tablePos)
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
    </>
  )
}
