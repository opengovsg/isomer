import { Flex, Link, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { ISOMER_SUPPORT_LINK } from "~/constants/misc"

import { NoResultIcon } from "../Svg/NoResultIcon"
import { getNotFoundCta } from "./getNotFoundCta"

export const DefaultNotFound = () => {
  const { pathname, query } = useRouter()
  const cta = getNotFoundCta(pathname, query.siteId)

  return (
    <Flex
      flexDirection="column"
      gap="1.5rem"
      alignItems="center"
      bg="base.canvas.backdrop"
      h="$100vh"
      justifyContent="center"
    >
      <NoResultIcon />
      <Flex flexDirection="column" gap="0.5rem" alignItems="center">
        <Text textStyle="h5" textAlign="center">
          This page no longer exists
        </Text>
        <Text textStyle="body-2" textAlign="center">
          It may have been deleted or moved. <br />
          If you think this is an error,{" "}
          <Link variant="inline" href={ISOMER_SUPPORT_LINK}>
            let us know
          </Link>
          .
        </Text>
        <Button mt="1.25rem" as={NextLink} href={cta.href}>
          {cta.label}
        </Button>
      </Flex>
    </Flex>
  )
}
