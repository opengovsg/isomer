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
import { deleteResourceModalAtom, folderSettingsModalAtom } from "../../atoms"

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
  const handleMoveResourceClick = () =>
    setMoveResource({ resourceId, title, permalink, parentId })
  const setResourceModalState = useSetAtom(deleteResourceModalAtom)
  const setFolderSettingsModalState = useSetAtom(folderSettingsModalAtom)

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
              <MenuItem isDisabled icon={<BiDuplicate fontSize="1rem" />}>
                Duplicate page
              </MenuItem>
            </>
          ) : (
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
          {(type === "Page" || type === "Folder") && (
            <MenuItem
              as="button"
              onClick={handleMoveResourceClick}
              icon={<BiFolderOpen fontSize="1rem" />}
            >
              Move to...
            </MenuItem>
          )}
          {resourceType !== ResourceType.RootPage && (
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
          )}
        </MenuList>
      </Portal>
    </Menu>
  )
}
