import { Flex, Icon, Text, useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { BiPencil } from "react-icons/bi"
import { TableSettingsModal } from "~/features/editing-experience/components/TableSettingsModal/TableSettingsModal"

import { isPlaceholderTableCaption } from "./utils"

export interface TableCaptionProps {
  caption: string
  onCaptionChange: (caption: string) => void
}

export const TableCaption = ({
  caption,
  onCaptionChange,
}: TableCaptionProps) => {
  const {
    isOpen: isTableSettingsModalOpen,
    onOpen: onTableSettingsModalOpen,
    onClose: onTableSettingsModalClose,
  } = useDisclosure()

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
          {hasCaption ? "Edit" : "Add caption"}
        </Button>
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
