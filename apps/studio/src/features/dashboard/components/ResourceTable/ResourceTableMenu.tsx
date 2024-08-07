import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { useSetAtom } from "jotai"
import {
  BiCog,
  BiDotsHorizontalRounded,
  BiDuplicate,
  BiFolderOpen,
  BiTrash,
} from "react-icons/bi"

import type { ResourceTableData } from "./types"
import { MenuItem } from "~/components/Menu"
import { moveResourceAtom } from "~/features/editing-experience/atoms"

interface ResourceTableMenuProps {
  title: ResourceTableData["title"]
  resourceId: ResourceTableData["id"]
  type: ResourceTableData["type"]
  permalink: ResourceTableData["permalink"]
}

export const ResourceTableMenu = ({
  resourceId,
  title,
  type,
  permalink,
}: ResourceTableMenuProps) => {
  const setMoveResource = useSetAtom(moveResourceAtom)
  const handleMoveResourceClick = () =>
    setMoveResource({ resourceId, title, permalink })
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
          {/* TODO: Open edit modal depending on resource  */}
          {type === "Page" ? (
            <>
              <MenuItem icon={<BiCog fontSize="1rem" />}>
                Edit page settings
              </MenuItem>
              <MenuItem icon={<BiDuplicate fontSize="1rem" />}>
                Duplicate page
              </MenuItem>
            </>
          ) : (
            <MenuItem icon={<BiCog fontSize="1rem" />}>
              Edit folder settings
            </MenuItem>
          )}
          <MenuItem
            as="button"
            onClick={handleMoveResourceClick}
            icon={<BiFolderOpen fontSize="1rem" />}
          >
            Move to...
          </MenuItem>
          <MenuItem colorScheme="critical" icon={<BiTrash fontSize="1rem" />}>
            Delete
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  )
}
