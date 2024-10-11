import { Flex, Link, Text } from "@chakra-ui/react"

import { NoResultIcon } from "../Svg/NoResultIcon"

export const DefaultNotFound = () => {
  return (
    <Flex
      flexDirection="column"
      gap="1.5rem"
      alignItems="center"
      marginTop="6rem"
      bg="base.canvas.backdrop"
    >
      <NoResultIcon />
      <Flex flexDirection="column" gap="0.5rem" alignItems="center">
        <Text textStyle="h5" textAlign="center">
          Expected to see something here?
        </Text>
        <Text textStyle="body-2" textAlign="center">
          Double check to ensure that the URL is correct. <br />
          If you think there's an error,{" "}
          <Link variant="inline" href="mailto:support@isomer.gov.sg">
            let us know
          </Link>
          .
        </Text>
      </Flex>
    </Flex>
  )
}
