import { useMemo } from "react"
import NextLink from "next/link"
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
import { getLinkToResource } from "~/utils/resource"
import { deleteResourceModalAtom, folderSettingsModalAtom } from "../../atoms"

interface ResourceTableMenuProps {
  title: ResourceTableData["title"]
  resourceId: ResourceTableData["id"]
  type: ResourceTableData["type"]
  permalink: ResourceTableData["permalink"]
  resourceType: ResourceTableData["type"]
  parentId: ResourceTableData["parentId"]
  siteId: number
}

export const ResourceTableMenu = ({
  resourceId,
  title,
  type,
  permalink,
  resourceType,
  parentId,
  siteId,
}: ResourceTableMenuProps) => {
  const setMoveResource = useSetAtom(moveResourceAtom)
  const handleMoveResourceClick = () =>
    setMoveResource({ resourceId, title, permalink, parentId })
  const setResourceModalState = useSetAtom(deleteResourceModalAtom)
  const setFolderSettingsModalState = useSetAtom(folderSettingsModalAtom)

  const linkToResourceSettings = useMemo(
    () => `${getLinkToResource({ siteId, resourceId, type })}/settings`,
    [siteId, resourceId, type],
  )

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
              <MenuItem
                as={NextLink}
                // @ts-expect-error type inconsistency with `as`
                href={linkToResourceSettings}
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
