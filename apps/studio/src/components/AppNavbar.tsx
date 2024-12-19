import Image from "next/image"
import NextLink from "next/link"
import { Flex, HStack, Tooltip } from "@chakra-ui/react"
import {
  AvatarMenu,
  Button,
  IconButton,
  Menu,
} from "@opengovsg/design-system-react"
import { BiLinkExternal } from "react-icons/bi"

import { ADMIN_NAVBAR_HEIGHT } from "~/constants/layouts"
import { useMe } from "~/features/me/api"
import { DASHBOARD } from "~/lib/routes"

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
        px={{ base: 0, md: "0.5rem" }}
        pl={{ base: `calc(1rem + ${ADMIN_NAVBAR_HEIGHT})`, sm: "1.5rem" }}
        py={{ base: 0, md: "0.5rem" }}
        bg="white"
        borderBottomWidth="1px"
        borderColor="base.divider.medium"
        transition="padding 0.1s"
      >
        <Flex alignItems="center">
          <Tooltip label={"Back to sites"} placement="right">
            <IconButton
              mr="0.5rem"
              as={NextLink}
              href={DASHBOARD}
              variant="clear"
              aria-label="Back to sites"
              icon={
                <Image
                  src="/assets/isomer-logo-color.svg"
                  height={24}
                  width={22}
                  alt="Back to sites"
                  priority
                />
              }
            />
          </Tooltip>
        </Flex>
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
            <Menu.Item onClick={() => logout()}>Sign out</Menu.Item>
          </AvatarMenu>
        </HStack>
      </Flex>
    </Flex>
  )
}
