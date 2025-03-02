import Image from "next/image"
import NextLink from "next/link"
import { Flex, HStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { BiLinkExternal } from "react-icons/bi"

import { ADMIN_NAVBAR_HEIGHT } from "~/constants/layouts"
import { AvatarMenu } from "./AvatarMenu"

export function AppNavbar(): JSX.Element {
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
        <Flex
          justifyContent="center"
          alignItems="center"
          mr="0.5rem"
          minH="2.75rem"
          minW="2.75rem"
        >
          <Image
            src="/assets/isomer-logo-color.svg"
            height={24}
            width={22}
            alt="Back to sites"
            priority
          />
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
          <AvatarMenu />
        </HStack>
      </Flex>
    </Flex>
  )
}
