import {
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { BiDotsHorizontalRounded } from "react-icons/bi"

import type { MenubarNestedItem } from "./types"
import { MenuItem } from "../../MenuItem"

export interface MenubarOverflowListProps {
  type: "overflow-list"
  items: MenubarNestedItem[]
}

export const MenubarOverflowList = ({
  items,
}: MenubarOverflowListProps): JSX.Element => {
  return (
    // closeOnBlur=false: with a TipTap CellSelection active, clicking the
    // trigger blurs the editor and TipTap's BubbleMenu tear-down races the
    // Popover open — closeOnBlur would immediately dismiss it. Keep the menu
    // open until the user clicks outside or picks an item.
    <Popover placement="bottom" closeOnBlur={false} isLazy>
      {({ isOpen, onClose }) => (
        <>
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
              // Keep the editor selection (e.g. CellSelection) when opening
              // the overflow menu — otherwise mousedown steals focus and the
              // popover open/close cycle fights TipTap's blur handlers.
              onMouseDown={(event) => event.preventDefault()}
            >
              <Icon
                as={BiDotsHorizontalRounded}
                fontSize="1.25rem"
                color="base.content.medium"
              />
            </IconButton>
          </PopoverTrigger>
          <PopoverContent w="fit-content">
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
      )}
    </Popover>
  )
}
