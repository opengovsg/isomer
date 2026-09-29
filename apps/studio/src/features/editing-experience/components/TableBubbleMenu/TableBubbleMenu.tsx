import type { Editor } from "@tiptap/react"
import { Flex, Icon, Portal, VStack } from "@chakra-ui/react"
import { memo } from "react"
import { BiPencil } from "react-icons/bi"

import { TableBubbleMenuActions } from "./TableBubbleMenuActions"
import { useTableBubbleMenu } from "./useTableBubbleMenu"

export interface TableBubbleMenuProps {
  editor: Editor
  isDragReordering?: boolean
}

export const TableBubbleMenu = memo(function TableBubbleMenu({
  editor,
  isDragReordering = false,
}: TableBubbleMenuProps) {
  const {
    show,
    kind,
    isActivated,
    menuRef,
    actionsRef,
    triggerRef,
    triggerPosition,
    actionsPosition,
    onMenuFocus,
    onMenuBlur,
    toggleMenu,
    deactivateMenu,
  } = useTableBubbleMenu(editor, isDragReordering)

  if (!show) {
    return null
  }

  return (
    <Portal>
      <div
        ref={menuRef}
        // Lets focus move between this portaled menu and Chakra modals (e.g. Table Settings).
        data-no-focus-lock
        onFocus={onMenuFocus}
        onBlur={onMenuBlur}
      >
        {isActivated && (
          <VStack
            ref={actionsRef}
            align="stretch"
            textAlign="left"
            position="fixed"
            left={actionsPosition ? `${actionsPosition.x}px` : 0}
            top={actionsPosition ? `${actionsPosition.y}px` : 0}
            visibility={actionsPosition ? "visible" : "hidden"}
            zIndex="dropdown"
            data-table-bubble-menu-actions
            bg="base.canvas.default"
            boxShadow="sm"
            borderRadius="0.25rem"
            border="1px solid"
            borderColor="base.divider.medium"
            py="0.5rem"
            gap="0"
            minW="10rem"
          >
            <TableBubbleMenuActions
              editor={editor}
              kind={kind}
              onColorSet={deactivateMenu}
            />
          </VStack>
        )}
        <Flex
          ref={triggerRef}
          as="button"
          type="button"
          aria-label="Table actions"
          aria-pressed={isActivated}
          data-table-bubble-menu
          data-table-bubble-menu-trigger
          position="fixed"
          left={triggerPosition ? `${triggerPosition.x}px` : 0}
          top={triggerPosition ? `${triggerPosition.y}px` : 0}
          visibility={triggerPosition ? "visible" : "hidden"}
          zIndex="dropdown"
          p="0.5rem"
          borderRadius="full"
          cursor="pointer"
          bg={isActivated ? "interaction.main.default" : "base.canvas.default"}
          boxShadow="0 0 10px 0 rgba(191, 191, 191, 0.50)"
          transition="background-color 0.15s, box-shadow 0.15s, filter 0.15s"
          sx={{
            _hover: {
              boxShadow: "0 0 12px 0 rgba(191, 191, 191, 0.65)",
              ...(isActivated
                ? { filter: "brightness(0.92)" }
                : { bg: "interaction.main-subtle.default" }),
            },
          }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleMenu}
        >
          <Icon
            as={BiPencil}
            fontSize="0.75rem"
            color={isActivated ? "white" : "interaction.main.default"}
          />
        </Flex>
      </div>
    </Portal>
  )
})
