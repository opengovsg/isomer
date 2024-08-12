import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { useSetAtom } from "jotai"
import { BiCog, BiDotsHorizontalRounded, BiTrash } from "react-icons/bi"

import type { CollectionTableData } from "./types"
import { MenuItem } from "~/components/Menu"
import { deleteResourceModalAtom } from "../../atoms"

interface CollectionTableMenuProps {
  title: CollectionTableData["title"]
  resourceId: CollectionTableData["id"]
  resourceType: CollectionTableData["resourceType"]
}

export const CollectionTableMenu = ({
  title,
  resourceId,
  resourceType,
}: CollectionTableMenuProps) => {
  const setValue = useSetAtom(deleteResourceModalAtom)

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
          <MenuItem
            onClick={() => {
              setValue({
                title,
                resourceId,
                resourceType,
              })
            }}
            colorScheme="critical"
            icon={<BiTrash fontSize="1rem" />}
          >
            Delete
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  )
}
