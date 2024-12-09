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
    <Popover placement="bottom">
      {({ isOpen }) => (
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
                    action={subItem.action}
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
