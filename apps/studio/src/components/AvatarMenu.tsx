import { Divider, Flex, MenuItemProps, Text } from "@chakra-ui/react"
import {
  Menu,
  AvatarMenu as OgpAvatarMenu,
} from "@opengovsg/design-system-react"
import { BiUser } from "react-icons/bi"
import { TbLogout } from "react-icons/tb"

import { useMe } from "~/features/me/api"

export const AvatarMenu = () => {
  const { me, logout } = useMe()

  return (
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
      <Menu.Item onClick={() => logout()}>
        <Flex alignItems="center" gap="0.75rem">
          <TbLogout size="1.25rem" />
          <Text>Sign Out</Text>
        </Flex>
      </Menu.Item>
    </OgpAvatarMenu>
  )
}
