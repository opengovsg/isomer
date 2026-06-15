import { Menu, MenuItem, MenuTrigger } from "@opengovsg/oui"
import { useSetAtom } from "jotai"
import {
  BiCog,
  BiDotsHorizontalRounded,
  BiFolderOpen,
  BiTrash,
} from "react-icons/bi"
import { CRITICAL_MENU_ITEM_CLASSNAMES } from "~/components/Menu"
import { IconButton } from "~/components/oui-bridge/IconButton"
import { moveResourceAtom } from "~/features/editing-experience/atoms"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { CollectionTableData } from "./types"
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
    setMoveResource({
      id: resourceId,
      title,
      permalink,
      parentId,
      type: resourceType,
    })
  }

  return (
    <MenuTrigger>
      <IconButton
        aria-label={`Options for ${title}`}
        color="neutral"
        icon={<BiDotsHorizontalRounded />}
        variant="clear"
      />
      <Menu size="sm">
        {(resourceType === ResourceType.CollectionPage ||
          resourceType === ResourceType.CollectionLink) && (
          <MenuItem
            startContent={<BiCog className="size-4" />}
            onAction={() =>
              setPageSettingsModalState({
                pageId: resourceId,
                type: resourceType,
              })
            }
          >
            Edit settings
          </MenuItem>
        )}
        <MenuItem
          startContent={<BiFolderOpen className="size-4" />}
          onAction={handleMoveResourceClick}
        >
          Move to...
        </MenuItem>
        {resourceType !== ResourceType.IndexPage && (
          <MenuItem
            onAction={() => {
              setValue({
                title,
                resourceId,
                resourceType,
              })
            }}
            classNames={CRITICAL_MENU_ITEM_CLASSNAMES}
            startContent={<BiTrash className="size-4" />}
          >
            Delete
          </MenuItem>
        )}
      </Menu>
    </MenuTrigger>
  )
}
