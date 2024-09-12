import Image from "next/image"
import NextLink from "next/link"
import { Flex, HStack } from "@chakra-ui/react"
import {
  AvatarMenu,
  AvatarMenuDivider,
  Button,
  Link,
  Menu,
} from "@opengovsg/design-system-react"
import { BiLinkExternal } from "react-icons/bi"

import { ADMIN_NAVBAR_HEIGHT } from "~/constants/layouts"
import { useMe } from "~/features/me/api"
import { DASHBOARD, SETTINGS_PROFILE } from "~/lib/routes"

export function AppNavbar(): JSX.Element {
  const { me, logout } = useMe()

  return (
    <Flex flex="0 0 auto" gridColumn="1/-1" height={ADMIN_NAVBAR_HEIGHT}>
      <Flex
        pos="fixed"
        zIndex="docked"
        w="100%"
        justify="space-between"
        align="center"
        px={{ base: "1.5rem", md: "1.8rem", xl: "2rem" }}
        pl={{ base: `calc(1rem + ${ADMIN_NAVBAR_HEIGHT})`, sm: "1.5rem" }}
        py="0.375rem"
        bg="white"
        borderBottomWidth="1px"
        borderColor="base.divider.medium"
        transition="padding 0.1s"
      >
        <Link
          as={NextLink}
          href={DASHBOARD}
          mx={{ base: "auto", sm: 0 }}
          transition="margin 0.1s"
        >
          <Image
            src="/assets/isomer-logo.svg"
            height={24}
            width={22}
            alt="Isomer Logo"
            aria-hidden
            priority
          />
        </Link>
        <HStack
          textStyle="subhead-1"
          spacing={{ base: "0.75rem", md: "1.5rem" }}
        >
          <Button
            variant="clear"
            size="xs"
            rightIcon={<BiLinkExternal fontSize="1.25rem" />}
            as={NextLink}
            target="_blank"
            href="https://go.gov.sg/isomer-issue"
          >
            Report an issue
          </Button>
          <AvatarMenu
            name={me.name}
            variant="subtle"
            bg="base.canvas.brand-subtle"
            menuListProps={{ maxWidth: "19rem" }}
          >
            <Menu.Item isDisabled as={NextLink} href={SETTINGS_PROFILE}>
              Edit profile
            </Menu.Item>
            <AvatarMenuDivider />
            <Menu.Item onClick={() => logout()}>Sign out</Menu.Item>
          </AvatarMenu>
        </HStack>
      </Flex>
    </Flex>
  )
}
