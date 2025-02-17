import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { useSetAtom } from "jotai"
import {
  BiCog,
  BiDotsHorizontalRounded,
  BiFolderOpen,
  BiTrash,
} from "react-icons/bi"

import type { CollectionTableData } from "./types"
import { MenuItem } from "~/components/Menu"
import { moveResourceAtom } from "~/features/editing-experience/atoms"
import { deleteResourceModalAtom, pageSettingsModalAtom } from "../../atoms"

interface CollectionTableMenuProps {
  title: CollectionTableData["title"]
  parentId: CollectionTableData["parentId"]
  permalink: CollectionTableData["permalink"]
  resourceId: CollectionTableData["id"]
  resourceType: CollectionTableData["type"]
}

export const CollectionTableMenu = ({
  title,
  resourceId,
  resourceType,
  parentId,
  permalink,
}: CollectionTableMenuProps) => {
  const setValue = useSetAtom(deleteResourceModalAtom)
  const setPageSettingsModalState = useSetAtom(pageSettingsModalAtom)
  const setMoveResource = useSetAtom(moveResourceAtom)
  const handleMoveResourceClick = () => {
    setMoveResource({ resourceId, title, permalink, parentId })
  }

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
          {resourceType === ResourceType.CollectionPage && (
            <MenuItem
              icon={<BiCog fontSize="1rem" />}
              onClick={() =>
                setPageSettingsModalState({
                  pageId: resourceId,
                  type: resourceType,
                })
              }
            >
              Edit page settings
            </MenuItem>
          )}
          <MenuItem
            as="button"
            icon={<BiFolderOpen fontSize="1rem" />}
            onClick={handleMoveResourceClick}
          >
            Move to...
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
