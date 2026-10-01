import type { Editor } from "@tiptap/react"
import { Box, HStack } from "@chakra-ui/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { useCallback } from "react"
import { BiPencil, BiUnlink } from "react-icons/bi"

import { MenuItem } from "../MenuItem"

const options = { placement: "bottom" as const }

interface TiptapLinkBubbleMenuProps {
  editor: Editor
  onEdit: () => void
  isLinkModalOpen: boolean
  // The menu node is portaled to document.body. Inside a modal it needs a
  // z-index above the dialog or the link actions render behind the overlay.
  menuZIndex?: number | string
}

export const TiptapLinkBubbleMenu = ({
  editor,
  onEdit,
  isLinkModalOpen,
  menuZIndex,
}: TiptapLinkBubbleMenuProps) => {
  const shouldShow = useCallback(
    ({ editor }: { editor: Editor }) =>
      !isLinkModalOpen && editor.isActive("link"),
    [isLinkModalOpen],
  )

  return (
    <BubbleMenu
      editor={editor}
      options={options}
      shouldShow={shouldShow}
      style={menuZIndex == null ? undefined : { zIndex: menuZIndex }}
    >
      <Box
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor="base.divider.medium"
        boxShadow="md"
        p="1"
      >
        <HStack spacing="1">
          <MenuItem icon={BiPencil} title="Edit link" action={onEdit} />
          <MenuItem
            icon={BiUnlink}
            title="Remove link"
            action={() =>
              editor.chain().focus().extendMarkRange("link").unsetLink().run()
            }
          />
        </HStack>
      </Box>
    </BubbleMenu>
  )
}
