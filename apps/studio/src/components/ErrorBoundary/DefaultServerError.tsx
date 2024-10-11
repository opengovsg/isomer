import NextLink from "next/link"
import { Flex, Link, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import { LiftUnderRepair } from "../Svg"

export const DefaultServerError = () => {
  return (
    <Flex
      flexDirection="column"
      gap="1.5rem"
      alignItems="center"
      marginTop="6rem"
      bg="base.canvas.backdrop"
    >
      <LiftUnderRepair />
      <Flex flexDirection="column" gap="0.5rem" alignItems="center">
        <Text textStyle="h5" textAlign="center">
          Something went wrong
        </Text>
        <Text textStyle="body-2" textAlign="center">
          It's not you, it's us. Please try refreshing this page.
          <br />
          If this issue persists,{" "}
          <Link variant="inline" href="mailto:support@isomer.gov.sg">
            contact Isomer Support
          </Link>
          .
        </Text>
        <Button mt="1.25rem" as={NextLink} href="/">
          Back to Home
        </Button>
      </Flex>
    </Flex>
  )
}
