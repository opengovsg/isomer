import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { BiCog, BiDotsHorizontalRounded, BiTrash } from "react-icons/bi"

import type { CollectionTableData } from "./types"
import { MenuItem } from "~/components/Menu"

interface CollectionTableMenuProps {
  title: CollectionTableData["title"]
  resourceId: CollectionTableData["id"]
}

export const CollectionTableMenu = ({ title }: CollectionTableMenuProps) => {
  return (
    <Menu isLazy size="sm">
      <MenuButton
        aria-label={`Options for ${title}`}
        as={IconButton}
        colorScheme="neutral"
        icon={<BiDotsHorizontalRounded />}
        variant="clear"
      />
      <Portal>
        <MenuList>
          <MenuItem icon={<BiCog fontSize="1rem" />}>
            Edit page settings
          </MenuItem>
          <MenuItem colorScheme="critical" icon={<BiTrash fontSize="1rem" />}>
            Delete
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  )
}
