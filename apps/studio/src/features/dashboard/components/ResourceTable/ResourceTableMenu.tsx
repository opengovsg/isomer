import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
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
import { Can } from "~/features/permissions"
import {
  deleteResourceModalAtom,
  folderSettingsModalAtom,
  pageSettingsModalAtom,
} from "../../atoms"

interface ResourceTableMenuProps {
  title: ResourceTableData["title"]
  resourceId: ResourceTableData["id"]
  type: ResourceTableData["type"]
  permalink: ResourceTableData["permalink"]
  resourceType: ResourceTableData["type"]
  parentId: ResourceTableData["parentId"]
}

export const ResourceTableMenu = ({
  resourceId,
  title,
  type,
  permalink,
  resourceType,
  parentId,
}: ResourceTableMenuProps) => {
  const setMoveResource = useSetAtom(moveResourceAtom)
  const handleMoveResourceClick = () => {
    setMoveResource({ resourceId, title, permalink, parentId })
  }
  const setResourceModalState = useSetAtom(deleteResourceModalAtom)
  const setFolderSettingsModalState = useSetAtom(folderSettingsModalAtom)
  const setPageSettingsModalState = useSetAtom(pageSettingsModalAtom)

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
          {type === ResourceType.Page && (
            <>
              <MenuItem
                onClick={() =>
                  setPageSettingsModalState({
                    pageId: resourceId,
                    type,
                  })
                }
                icon={<BiCog fontSize="1rem" />}
              >
                Edit page settings
              </MenuItem>

              {/* TODO(ISOM-1552): Add back duplicate page functionality when implemented */}
              <Can do="create" on={{ parentId }}>
                <MenuItem isDisabled icon={<BiDuplicate fontSize="1rem" />}>
                  Duplicate page
                </MenuItem>
              </Can>
            </>
          )}
          {type === ResourceType.Folder && (
            <MenuItem
              onClick={() =>
                setFolderSettingsModalState({
                  folderId: resourceId,
                })
              }
              icon={<BiCog fontSize="1rem" />}
            >
              Edit folder settings
            </MenuItem>
          )}
          {(type === ResourceType.Page || type === ResourceType.Folder) && (
            // TODO: we need to change the resourceid next time when we implement root level permissions
            <Can do="move" on={{ parentId }}>
              <MenuItem
                as="button"
                onClick={handleMoveResourceClick}
                icon={<BiFolderOpen fontSize="1rem" />}
              >
                Move to...
              </MenuItem>
            </Can>
          )}
          {resourceType !== ResourceType.RootPage && (
            <Can do="delete" on={{ parentId }}>
              <MenuItem
                onClick={() => {
                  setResourceModalState({
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
            </Can>
          )}
        </MenuList>
      </Portal>
    </Menu>
  )
}
