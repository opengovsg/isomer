import {
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
  useOutsideClick,
} from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { useRef } from "react"
import { BiDotsHorizontalRounded } from "react-icons/bi"

import type { MenubarNestedItem } from "./types"
import { MenuItem } from "../../MenuItem"

export interface MenubarOverflowListProps {
  type: "overflow-list"
  items: MenubarNestedItem[]
}

export const MenubarOverflowList = ({
  items,
}: MenubarOverflowListProps): JSX.Element | null => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const contentRef = useRef<HTMLDivElement>(null)
  // TipTap toolbar pattern: preventDefault on mousedown so the trigger
  // does not steal focus from the editor. Pair with closeOnBlur=false —
  // otherwise focus never enters the popover and closeOnBlur immediately
  // dismisses (or fights) the open state. useOutsideClick restores
  // click-outside dismissal without relying on blur.
  useOutsideClick({ ref: contentRef, handler: onClose, enabled: isOpen })

  const visibleItems = items.filter((item) => !item.isHidden?.())
  if (visibleItems.length === 0) {
    return null
  }
  return (
    <Popover
      placement="bottom"
      closeOnBlur={false}
      isLazy
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
    >
      <PopoverTrigger>
        <IconButton
          variant="clear"
          colorScheme="neutral"
          isActive={isOpen}
          _active={{
            bg: "interaction.muted.main.active",
          }}
          h="1.75rem"
          w="1.75rem"
          minH="1.75rem"
          minW="1.75rem"
          p="0.25rem"
          aria-label="More options"
          onMouseDown={(event) => event.preventDefault()}
        >
          <Icon
            as={BiDotsHorizontalRounded}
            fontSize="1.25rem"
            color="base.content.medium"
          />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent ref={contentRef} w="fit-content">
        <PopoverBody>
          <HStack>
            {visibleItems.map((subItem, index) => (
              <MenuItem
                key={index}
                icon={subItem.icon}
                title={subItem.title}
                action={() => {
                  subItem.action()
                  onClose()
                }}
                isActive={subItem.isActive}
              />
            ))}
          </HStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
