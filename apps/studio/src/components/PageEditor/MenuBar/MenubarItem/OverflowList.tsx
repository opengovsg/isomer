import {
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { useEffect, useRef } from "react"
import { BiDotsHorizontalRounded } from "react-icons/bi"

import type { MenubarNestedItem } from "./types"
import { MenuItem } from "../../MenuItem"

export interface MenubarOverflowListProps {
  type: "overflow-list"
  items: MenubarNestedItem[]
}

// Split out of MenubarOverflowList so the outside-click effect below can
// live in a real component instead of Popover's render-prop callback (hooks
// can't run inside a plain callback).
const OverflowListPopoverContent = ({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean
  onClose: () => void
  items: MenubarNestedItem[]
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return
      }
      onClose()
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [isOpen, onClose])

  return (
    <>
      <PopoverTrigger>
        <IconButton
          ref={triggerRef}
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
            {items.map((subItem, index) => (
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
    </>
  )
}

export const MenubarOverflowList = ({
  items,
}: MenubarOverflowListProps): JSX.Element | null => {
  const visibleItems = items.filter((item) => !item.isHidden?.())
  if (visibleItems.length === 0) {
    return null
  }
  return (
    // TipTap toolbar pattern: preventDefault on mousedown so the trigger
    // does not steal focus from the editor. Pair with closeOnBlur=false —
    // otherwise focus never enters the popover and closeOnBlur immediately
    // dismisses (or fights) the open state. That also disables Chakra's own
    // outside-click handling (it's gated on closeOnBlur too);
    // OverflowListPopoverContent reimplements just that part.
    <Popover placement="bottom" closeOnBlur={false} isLazy>
      {({ isOpen, onClose }) => (
        <OverflowListPopoverContent
          isOpen={isOpen}
          onClose={onClose}
          items={visibleItems}
        />
      )}
    </Popover>
  )
}
