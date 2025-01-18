import { Divider, Flex, Text } from "@chakra-ui/react"
import {
  AvatarMenu as AvatarMenuComponent,
  Menu,
} from "@opengovsg/design-system-react"
import { BiUser } from "react-icons/bi"

import { useMe } from "~/features/me/api"

export const AvatarMenu = () => {
  const { me, logout } = useMe()

  return (
    <AvatarMenuComponent
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
      <Menu.Item onClick={() => logout()}>Sign out</Menu.Item>
    </AvatarMenuComponent>
  )
}
