import { Center, Flex, Icon, Stack, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import { BiWrench } from "react-icons/bi"

import { REDIRECTS_SUPPORT_LINK } from "../constants"

export const RedirectsHeader = (): JSX.Element => {
  return (
    <Flex justifyContent="space-between" align="center" w="full">
      <Stack spacing="0.5rem">
        <Flex align="center" gap="0.75rem">
          <Center
            w="2rem"
            h="2rem"
            bgColor="brand.secondary.100"
            borderRadius="6px"
          >
            <Icon as={BiWrench} boxSize="1rem" />
          </Center>
          <Text as="h1" textStyle="h3">
            Redirects
          </Text>
        </Flex>
        <Text textStyle="body-2" color="base.content.medium">
          Keep old links working. Redirects send anyone who visits an outdated
          URL to the right place instead. Learn{" "}
          <Link variant="inline" href={REDIRECTS_SUPPORT_LINK} isExternal>
            how to use redirects
          </Link>
          .
        </Text>
      </Stack>
    </Flex>
  )
}
