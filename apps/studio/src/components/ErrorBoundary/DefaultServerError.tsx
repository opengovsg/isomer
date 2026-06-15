import { Flex, Link, Text } from "@chakra-ui/react"
import { ButtonLink } from "~/components/oui-bridge/ButtonLink"
import { ISOMER_SUPPORT_LINK } from "~/constants/misc"

import { LiftUnderRepair } from "../Svg"

export const DefaultServerError = () => {
  return (
    <Flex
      flexDirection="column"
      gap="1.5rem"
      h="$100vh"
      alignItems="center"
      bg="base.canvas.backdrop"
      justifyContent="center"
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
          <Link variant="inline" href={ISOMER_SUPPORT_LINK}>
            contact Isomer Support
          </Link>
          .
        </Text>
        <ButtonLink className="mt-5" href="/">
          Back to Home
        </ButtonLink>
      </Flex>
    </Flex>
  )
}
