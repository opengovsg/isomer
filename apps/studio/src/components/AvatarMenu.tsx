import { useEffect } from "react"
import { Divider, Flex, Text } from "@chakra-ui/react"
import { useGrowthBook } from "@growthbook/growthbook-react"
import {
  Menu,
  AvatarMenu as OgpAvatarMenu,
} from "@opengovsg/design-system-react"
import { useSetAtom } from "jotai"
import { BiLogOut, BiPencil, BiUser } from "react-icons/bi"

import type { GrowthbookAttributes } from "~/types/growthbook"
import { useMe } from "~/features/me/api"
import { updateProfileModalOpenAtom } from "~/features/users/atoms"
import { EditProfileModal } from "~/features/users/components"

export const AvatarMenu = () => {
  const { me, logout } = useMe()
  const gb = useGrowthBook()

  const setIsEditProfileModalOpen = useSetAtom(updateProfileModalOpenAtom)

  useEffect(() => {
    const newAttributes: Partial<GrowthbookAttributes> = {
      email: me.email,
    }

    void gb.setAttributes(newAttributes)
  }, [gb, me])

  return (
    <>
      <OgpAvatarMenu
        name={me.name}
        variant="subtle"
        bg="base.canvas.brand-subtle"
        menuListProps={{ maxWidth: "19rem" }}
      >
        <Menu.Item
          isDisabled
          style={{ cursor: "default", backgroundColor: "transparent" }}
        >
          <Flex alignItems="center" gap="0.75rem">
            <BiUser size="1.25rem" color="#666c7a" />
            <Text textStyle="subhead-1" textColor="base.content.medium">
              {me.email}
            </Text>
          </Flex>
        </Menu.Item>
        <Divider orientation="horizontal" />
        <Menu.Item
          onClick={() => setIsEditProfileModalOpen(true)}
          // This is a hotfix because OGPDS MenuItem has an issue of the next item
          // covering the bottom border of the current item when current item is active
          // Reference: https://github.com/opengovsg/isomer/pull/1138#issuecomment-2683836810
          sx={{ mb: "0.125rem" }}
        >
          <Flex alignItems="center" gap="0.75rem">
            <BiPencil size="1.25rem" />
            <Text>Edit profile</Text>
          </Flex>
        </Menu.Item>
        <Menu.Item onClick={() => logout()}>
          <Flex alignItems="center" gap="0.75rem">
            <BiLogOut size="1.25rem" />
            <Text>Sign out</Text>
          </Flex>
        </Menu.Item>
      </OgpAvatarMenu>
      <EditProfileModal />
    </>
  )
}
